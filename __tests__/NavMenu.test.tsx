import { render, screen } from '@testing-library/react';
import { NavMenu } from '@/app/components/menu';
import { usePathname } from '../jest.setup';

describe('NavMenu', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all navigation links', () => {
    usePathname.mockReturnValue('/');
    render(<NavMenu />);
    
    expect(screen.getByText('Inbox')).toBeInTheDocument();
    expect(screen.getByText('Processed')).toBeInTheDocument();
    expect(screen.getByText('Filters & Actions')).toBeInTheDocument();
  });

  it('highlights active link based on current path', () => {
    usePathname.mockReturnValue('/inbox');
    render(<NavMenu />);
    
    const inboxLink = screen.getByText('Inbox').closest('a');
    expect(inboxLink).toHaveClass('bg-accent');
  });

  it('applies hover styles to non-active links', () => {
    usePathname.mockReturnValue('/inbox');
    render(<NavMenu />);
    
    const processedLink = screen.getByText('Processed').closest('a');
    expect(processedLink).toHaveClass('text-gray-700');
    expect(processedLink).toHaveClass('hover:bg-gray-100');
  });

  it('includes correct icons for each menu item', () => {
    usePathname.mockReturnValue('/');
    render(<NavMenu />);
    
    const links = screen.getAllByRole('link');
    links.forEach(link => {
      expect(link.querySelector('svg')).toBeInTheDocument();
    });
  });

  it('has correct href attributes for all links', () => {
    usePathname.mockReturnValue('/');
    render(<NavMenu />);
    
    expect(screen.getByText('Inbox').closest('a')).toHaveAttribute('href', '/inbox');
    expect(screen.getByText('Processed').closest('a')).toHaveAttribute('href', '/processed');
    expect(screen.getByText('Filters & Actions').closest('a')).toHaveAttribute('href', '/settings/filters');
  });
}); 