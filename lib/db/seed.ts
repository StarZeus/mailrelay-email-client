import { db } from './drizzle';
import {
  users,
  emails,
  filterRules,
  filterActions,
  processedEmails,
} from './schema';

async function seed() {
  console.log('Starting seed process...');
  
  // Seed users
  const [user1, user2, user3] = await db.insert(users).values([
    {
      firstName: 'Lee',
      lastName: 'Robinson',
      email: 'lee@example.com',
      jobTitle: 'VP of Product',
      company: 'Acme Inc',
      location: 'New York',
      avatarUrl: 'https://github.com/leerob.png',
    },
    {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      jobTitle: 'Engineer',
      company: 'Tech Corp',
      location: 'San Francisco',
      avatarUrl: 'https://github.com/johndoe.png',
    },
    {
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@example.com',
      jobTitle: 'Designer',
      company: 'Design Co',
      location: 'London',
      avatarUrl: 'https://github.com/janesmith.png',
    },
  ]).returning();

  // Seed emails
  const [email1, email2, email3] = await db.insert(emails).values([
    {
      fromEmail: 'lee@example.com',
      toEmail: 'john@example.com',
      subject: 'Project Update',
      body: 'Here is the latest project update...',
      sentDate: new Date(),
      read: false,
    },
    {
      fromEmail: 'john@example.com',
      toEmail: 'jane@example.com',
      subject: 'Design Review',
      body: 'Can we review the latest designs?',
      sentDate: new Date(),
      read: true,
    },
    {
      fromEmail: 'jane@example.com',
      toEmail: 'lee@example.com',
      subject: 'Meeting Notes',
      body: 'Notes from today\'s meeting...',
      sentDate: new Date(),
      read: false,
    },
  ]).returning();

  // Seed filter rules
  const [rule1, rule2, rule3] = await db.insert(filterRules).values([
    {
      name: 'Important Emails',
      fromPattern: '*@example.com',
      subjectPattern: 'urgent|important',
      operator: 'AND',
    },
    {
      name: 'Archive Old',
      subjectPattern: 'archive|old',
      operator: 'OR',
    },
    {
      name: 'Team Updates',
      fromPattern: 'team@*',
      subjectPattern: 'update|status',
      operator: 'AND',
    },
  ]).returning();

  // Seed filter actions
  const [action1, action2, action3] = await db.insert(filterActions).values([
    {
      ruleId: rule1.id,
      type: 'mark_important',
      config: { flag: true },
    },
    {
      ruleId: rule2.id,
      type: 'archive',
      config: { folder: 'archive' },
    },
    {
      ruleId: rule3.id,
      type: 'move',
      config: { folder: 'team-updates' },
    },
  ]).returning();

  // Seed processed emails
  await db.insert(processedEmails).values([
    {
      emailId: email1.id,
      ruleId: rule1.id,
      actionId: action1.id,
      status: 'success',
      processedAt: new Date(),
    },
    {
      emailId: email2.id,
      ruleId: rule2.id,
      actionId: action2.id,
      status: 'success',
      processedAt: new Date(),
    },
    {
      emailId: email3.id,
      ruleId: rule3.id,
      actionId: action3.id,
      status: 'success',
      processedAt: new Date(),
    },
  ]);


  console.log('Seed process completed successfully.');
}

seed()
  .catch((error) => {
    console.error('Seed process failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    console.log('Seed process finished. Exiting...');
    process.exit(0);
  });
