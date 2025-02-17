import { render, screen, fireEvent } from '@testing-library/react';
import { Header } from '../header';
import { useRouter, useSearchParams } from 'next/navigation';

jest.mock('next/navigation');

describe('Header Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the logo and title', () => {
    render(<Header />);
    
    expect(screen.getByText('MailRelay')).toBeInTheDocument();
    expect(screen.getByText('SMTP Client')).toBeInTheDocument();
    expect(screen.getByText('Secure Email Processing')).toBeInTheDocument();
  });

  it('renders the search input', () => {
    render(<Header />);
    
    const searchInput = screen.getByPlaceholderText('Type to search...');
    expect(searchInput).toBeInTheDocument();
  });

  it('updates search params when search input changes', () => {
    const mockRouter = { push: jest.fn() };
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams());

    render(<Header />);
    
    const searchInput = screen.getByPlaceholderText('Type to search...');
    fireEvent.change(searchInput, { target: { value: 'test search' } });

    // Wait for debounce
    jest.advanceTimersByTime(300);
    
    expect(mockRouter.push).toHaveBeenCalledWith('/?q=test+search');
  });

  it('preserves existing search params when updating search', () => {
    const mockRouter = { push: jest.fn() };
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    
    const searchParams = new URLSearchParams();
    searchParams.set('existing', 'param');
    (useSearchParams as jest.Mock).mockReturnValue(searchParams);

    render(<Header />);
    
    const searchInput = screen.getByPlaceholderText('Type to search...');
    fireEvent.change(searchInput, { target: { value: 'test search' } });

    // Wait for debounce
    jest.advanceTimersByTime(300);
    
    expect(mockRouter.push).toHaveBeenCalledWith('/?existing=param&q=test+search');
  });
}); 