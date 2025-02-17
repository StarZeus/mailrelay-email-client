import { render, screen, fireEvent } from '@testing-library/react';
import { Header } from '@/app/components/header';
import { useRouter, useSearchParams } from '../jest.setup';

describe('Header', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders logo and title', () => {
    render(<Header />);
    expect(screen.getByText('MailRelay')).toBeInTheDocument();
    expect(screen.getByText('SMTP Client')).toBeInTheDocument();
    expect(screen.getByText('Secure Email Processing')).toBeInTheDocument();
  });

  it('renders search input', () => {
    render(<Header />);
    expect(screen.getByPlaceholderText('Type to search...')).toBeInTheDocument();
  });

  it('updates search params when search input changes', () => {
    const mockRouter = { push: jest.fn() };
    useRouter.mockReturnValue(mockRouter);
    useSearchParams.mockReturnValue(new URLSearchParams());

    render(<Header />);
    
    const searchInput = screen.getByPlaceholderText('Type to search...');
    fireEvent.change(searchInput, { target: { value: 'test search' } });

    // Wait for debounce
    jest.advanceTimersByTime(300);
    
    expect(mockRouter.push).toHaveBeenCalledWith('/?q=test+search');
  });

  it('preserves existing search params when updating search', () => {
    const mockRouter = { push: jest.fn() };
    useRouter.mockReturnValue(mockRouter);
    
    const searchParams = new URLSearchParams();
    searchParams.set('existing', 'param');
    useSearchParams.mockReturnValue(searchParams);

    render(<Header />);
    
    const searchInput = screen.getByPlaceholderText('Type to search...');
    fireEvent.change(searchInput, { target: { value: 'test search' } });

    // Wait for debounce
    jest.advanceTimersByTime(300);
    
    expect(mockRouter.push).toHaveBeenCalledWith('/?existing=param&q=test+search');
  });
}); 