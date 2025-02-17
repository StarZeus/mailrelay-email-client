import { cn, formatEmailString } from '../utils';

describe('Utility Functions', () => {
  describe('cn (className merger)', () => {
    it('merges multiple class names', () => {
      const result = cn('class1', 'class2', 'class3');
      expect(result).toBe('class1 class2 class3');
    });

    it('handles conditional classes', () => {
      const result = cn('base', true && 'included', false && 'excluded');
      expect(result).toBe('base included');
    });

    it('handles undefined and null values', () => {
      const result = cn('base', undefined, null, 'valid');
      expect(result).toBe('base valid');
    });

    it('handles tailwind class merging', () => {
      const result = cn('p-4 bg-red-500', 'p-6', 'bg-blue-500');
      expect(result).toBe('p-6 bg-blue-500');
    });
  });

  describe('formatEmailString', () => {
    it('returns full name when firstName and lastName are provided', () => {
      const user = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com'
      };
      expect(formatEmailString(user)).toBe('John Doe');
    });

    it('returns email when name is not provided', () => {
      const user = {
        email: 'john@example.com'
      };
      expect(formatEmailString(user)).toBe('john@example.com');
    });

    it('returns email when names are null', () => {
      const user = {
        firstName: null,
        lastName: null,
        email: 'john@example.com'
      };
      expect(formatEmailString(user)).toBe('john@example.com');
    });

    it('returns email when names are undefined', () => {
      const user = {
        firstName: undefined,
        lastName: undefined,
        email: 'john@example.com'
      };
      expect(formatEmailString(user)).toBe('john@example.com');
    });
  });
}); 