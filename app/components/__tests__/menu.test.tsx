import { render, screen } from '@testing-library/react';
import { NavMenu } from '../menu';
import { usePathname } from 'next/navigation';

jest.mock('next/navigation');

describe('NavMenu Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all navigation links', () => {
    (usePathname as jest.Mock).mockReturnValue('/');
    
    render(<NavMenu />);
    
    expect(screen.getByText('Inbox')).toBeInTheDocument();
    expect(screen.getByText('Processed')).toBeInTheDocument();
    expect(screen.getByText('Filters & Actions')).toBeInTheDocument();
  });

  it('highlights the active link based on current path', () => {
    (usePathname as jest.Mock).mockReturnValue('/inbox');
    
    render(<NavMenu />);
    
    const inboxLink = screen.getByText('Inbox').closest('a');
    expect(inboxLink).toHaveClass('bg-accent');
    
    const processedLink = screen.getByText('Processed').closest('a');
    expect(processedLink).not.toHaveClass('bg-accent');
  });

  it('applies hover styles to non-active links', () => {
    (usePathname as jest.Mock).mockReturnValue('/inbox');
    
    render(<NavMenu />);
    
    const processedLink = screen.getByText('Processed').closest('a');
    expect(processedLink).toHaveClass('hover:bg-gray-100');
  });

  it('includes correct icons for each menu item', () => {
    (usePathname as jest.Mock).mockReturnValue('/');
    
    render(<NavMenu />);
    
    // Check if icons are rendered (they're SVG elements)
    const menuItems = screen.getAllByRole('link');
    menuItems.forEach(item => {
      expect(item.querySelector('svg')).toBeInTheDocument();
    });
  });

  it('has correct href attributes for all links', () => {
    (usePathname as jest.Mock).mockReturnValue('/');
    
    render(<NavMenu />);
    
    const inboxLink = screen.getByText('Inbox').closest('a');
    const processedLink = screen.getByText('Processed').closest('a');
    const filtersLink = screen.getByText('Filters & Actions').closest('a');

    expect(inboxLink).toHaveAttribute('href', '/inbox');
    expect(processedLink).toHaveAttribute('href', '/processed');
    expect(filtersLink).toHaveAttribute('href', '/settings/filters');
  });
}); 