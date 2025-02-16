import { filterRules, filterActions, processedEmails, users } from './schema';
import { sql, eq, and, or, ilike, desc } from 'drizzle-orm';
import { db } from './index';

export async function getAllEmailAddresses() {
  'use cache';

  return db
    .select({
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
    })
    .from(users);
}

export async function getUserProfile(userId: number) {
  'use cache';

  const userInfo = await db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      jobTitle: users.jobTitle,
      company: users.company,
      location: users.location,
      avatarUrl: users.avatarUrl,
      linkedin: users.linkedin,
      twitter: users.twitter,
      github: users.github,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
    .execute();

  if (userInfo.length === 0) {
    return null;
  }

  return userInfo[0];
}
