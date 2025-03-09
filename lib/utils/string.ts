import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatEmailString(
  userEmail: {
    firstName: string | null;
    lastName: string | null;
    email: string;
  },
  opts: { includeFullEmail: boolean } = { includeFullEmail: false },
) {
  if (userEmail.firstName && userEmail.lastName) {
    return `${userEmail.firstName} ${userEmail.lastName} ${
      opts.includeFullEmail ? `<${userEmail.email}>` : ''
    }`;
  }
  return userEmail.email;
}

export function toTitleCase(str: string) {
  return str.replace(/\w\S*/g, function (txt: string) {
    return txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase();
  });
}

export function parseEmail(inputEmail: string): { name: string | null; email: string } {
  // Handle formats like:
  // "Name" <email@domain.com>
  // Name <email@domain.com>
  // <email@domain.com>
  // email@domain.com
  
  // First try to match the format with angle brackets
  const angleMatch = inputEmail.match(/^(?:"([^"]+)"|([^<]+?))?(?:\s*<([^>]+)>)$/);
  if (angleMatch) {
    const [, quotedName, unquotedName, email] = angleMatch;
    const name = quotedName || (unquotedName ? unquotedName.trim() : null);
    return {
      name: name,
      email: email.trim()
    };
  }
  
  // If no angle brackets, check if it's a valid email address
  const emailMatch = inputEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  if (emailMatch) {
    return {
      name: null,
      email: inputEmail.trim()
    };
  }
  
  // If nothing matches, return the input as email
  return {
    name: null,
    email: inputEmail
  };
}