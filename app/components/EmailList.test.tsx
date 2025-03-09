import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EmailList } from './EmailList';
import { parseEmail } from '@/lib/utils/string';

// Mock fetch
global.fetch = jest.fn(() => 
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve([])
  })
) as jest.Mock;

describe('EmailList Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state', () => {
    (global.fetch as jest.Mock).mockImplementationOnce(() => 
      new Promise(() => {})
    );
    
    render(<EmailList />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders error state', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Failed to fetch'));
    
    render(<EmailList />);
    await waitFor(() => {
      expect(screen.getByText('Error: Failed to fetch')).toBeInTheDocument();
    });
  });

  it('renders empty state', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ([])
    });
    
    render(<EmailList />);
    await waitFor(() => {
      expect(screen.getByText('No emails found')).toBeInTheDocument();
    });
  });

  it('renders email list and handles read status', async () => {
    const mockEmails = [{
      id: '1',
      subject: 'Test Subject',
      fromEmail: 'John Doe <sender@test.com>',
      sentDate: new Date().toISOString(),
      read: false
    }];

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockEmails
      })
      .mockResolvedValueOnce({
        ok: true
      });

    render(<EmailList />);
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Test Subject')).toBeInTheDocument();
      expect(screen.queryByText('sender@test.com')).not.toBeInTheDocument();
    });

    // Click email to mark as read
    fireEvent.click(screen.getByTestId('email-item'));
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/emails/1/read',
        expect.objectContaining({ method: 'PUT' })
      );
    });
  });

  it('handles API error when marking email as read', async () => {
    const mockEmails = [{
      id: '1',
      subject: 'Test Subject',
      fromEmail: 'sender@test.com',
      sentDate: new Date().toISOString(),
      read: false
    }];

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockEmails
      })
      .mockRejectedValueOnce(new Error('Failed to mark as read'));

    render(<EmailList />);
    
    await waitFor(() => {
      expect(screen.getByTestId('email-item')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('email-item'));
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/emails/1/read',
        expect.objectContaining({ method: 'PUT' })
      );
    });
  });
});

describe('parseEmail function', () => {
  const testCases = [
    {
      input: '"John Doe" <john@example.com>',
      expected: { name: 'John Doe', email: 'john@example.com' }
    },
    {
      input: 'John Doe <john@example.com>',
      expected: { name: 'John Doe', email: 'john@example.com' }
    },
    {
      input: '<john@example.com>',
      expected: { name: null, email: 'john@example.com' }
    },
    {
      input: 'john@example.com',
      expected: { name: null, email: 'john@example.com' }
    },
    {
      input: '"Support Team" <support@company.com>',
      expected: { name: 'Support Team', email: 'support@company.com' }
    },
    {
      input: 'Marketing <marketing@company.com>',
      expected: { name: 'Marketing', email: 'marketing@company.com' }
    },
    {
      input: '"Sales & Support" <sales@company.com>',
      expected: { name: 'Sales & Support', email: 'sales@company.com' }
    },
    {
      input: '"Smith, John" <john.smith@company.com>',
      expected: { name: 'Smith, John', email: 'john.smith@company.com' }
    },
    {
      input: 'no-reply@company.com',
      expected: { name: null, email: 'no-reply@company.com' }
    },
    {
      input: '<notifications@github.com>',
      expected: { name: null, email: 'notifications@github.com' }
    }
  ];

  testCases.forEach(({ input, expected }) => {
    it(`correctly parses "${input}"`, () => {
      const result = parseEmail(input);
      expect(result).toEqual(expected);
    });
  });

  it('handles invalid email formats gracefully', () => {
    const invalidInputs = [
      '',
      'invalid email',
      '@invalid.com',
      '<incomplete@email',
      'incomplete@email>',
    ];

    invalidInputs.forEach(input => {
      const result = parseEmail(input);
      expect(result).toEqual({ name: null, email: input });
    });
  });
}); 