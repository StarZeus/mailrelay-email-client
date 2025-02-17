import '@testing-library/jest-dom';

// Mock Next.js router
const useRouter = jest.fn(() => ({
  push: jest.fn(),
  pathname: '/',
}));

const useSearchParams = jest.fn(() => ({
  get: jest.fn(),
  toString: jest.fn(),
}));

const usePathname = jest.fn(() => '/');

jest.mock('next/navigation', () => ({
  useRouter,
  useSearchParams,
  usePathname,
}));

// Export mocks for use in tests
export { useRouter, useSearchParams, usePathname };

// Mock intersection observer
const mockIntersectionObserver = jest.fn();
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null,
});
window.IntersectionObserver = mockIntersectionObserver;

// Mock timers for debounce
jest.useFakeTimers(); 