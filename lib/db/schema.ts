import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  uniqueIndex,
  index,
  boolean,
  jsonb,
} from 'drizzle-orm/pg-core';
import { relations, Many } from 'drizzle-orm';

export const users = pgTable(
  'users',
  {
    id: serial('id').primaryKey(),
    firstName: varchar('first_name', { length: 50 }),
    lastName: varchar('last_name', { length: 50 }),
    email: varchar('email', { length: 255 }).notNull(),
    jobTitle: varchar('job_title', { length: 100 }),
    company: varchar('company', { length: 100 }),
    location: varchar('location', { length: 100 }),
    twitter: varchar('twitter', { length: 100 }),
    linkedin: varchar('linkedin', { length: 100 }),
    github: varchar('github', { length: 100 }),
    avatarUrl: varchar('avatar_url', { length: 255 }),
  },
  (table) => {
    return {
      emailIndex: uniqueIndex('email_idx').on(table.email),
    };
  }
);

export const threads = pgTable('threads', {
  id: serial('id').primaryKey(),
  subject: varchar('subject', { length: 255 }),
  lastActivityDate: timestamp('last_activity_date').defaultNow(),
});

export const emails = pgTable(
  'emails',
  {
    id: serial('id').primaryKey(),
    threadId: integer('thread_id').references(() => threads.id),
    senderId: integer('sender_id').references(() => users.id),
    recipientId: integer('recipient_id').references(() => users.id),
    subject: varchar('subject', { length: 255 }),
    body: text('body'),
    sentDate: timestamp('sent_date').defaultNow(),
  },
  (table) => {
    return {
      threadIdIndex: index('thread_id_idx').on(table.threadId),
      senderIdIndex: index('sender_id_idx').on(table.senderId),
      recipientIdIndex: index('recipient_id_idx').on(table.recipientId),
      sentDateIndex: index('sent_date_idx').on(table.sentDate),
    };
  }
);

export const folders = pgTable('folders', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 50 }).notNull(),
});

export const userFolders = pgTable('user_folders', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  folderId: integer('folder_id').references(() => folders.id),
});

export const threadFolders = pgTable('thread_folders', {
  id: serial('id').primaryKey(),
  threadId: integer('thread_id').references(() => threads.id),
  folderId: integer('folder_id').references(() => folders.id),
});

export const filterRules = pgTable('filter_rules', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  fromPattern: text('from_pattern'),
  toPattern: text('to_pattern'),
  subjectPattern: text('subject_pattern'),
  operator: varchar('operator', { length: 10 }).notNull().default('AND'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const filterActions = pgTable('filter_actions', {
  id: serial('id').primaryKey(),
  ruleId: serial('rule_id').references(() => filterRules.id),
  type: varchar('type', { length: 50 }).notNull(),
  config: jsonb('config').notNull().default({}),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const processedEmails = pgTable('processed_emails', {
  id: serial('id').primaryKey(),
  emailId: integer('email_id').references(() => emails.id),
  ruleId: integer('rule_id').references(() => filterRules.id),
  actionId: integer('action_id').references(() => filterActions.id),
  status: varchar('status', { length: 50 }).notNull(), // 'success', 'failed'
  error: text('error'),
  processedAt: timestamp('processed_at').defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  sentEmails: many(emails, { relationName: 'sender' }),
  receivedEmails: many(emails, { relationName: 'recipient' }),
  userFolders: many(userFolders),
}));

export const threadsRelations = relations(threads, ({ many }) => ({
  emails: many(emails),
  threadFolders: many(threadFolders),
}));

export const emailsRelations = relations(emails, ({ one }) => ({
  thread: one(threads, {
    fields: [emails.threadId],
    references: [threads.id],
  }),
  sender: one(users, {
    fields: [emails.senderId],
    references: [users.id],
    relationName: 'sender',
  }),
  recipient: one(users, {
    fields: [emails.recipientId],
    references: [users.id],
    relationName: 'recipient',
  }),
}));

export const foldersRelations = relations(folders, ({ many }) => ({
  userFolders: many(userFolders),
  threadFolders: many(threadFolders),
}));

export const userFoldersRelations = relations(userFolders, ({ one }) => ({
  user: one(users, { fields: [userFolders.userId], references: [users.id] }),
  folder: one(folders, {
    fields: [userFolders.folderId],
    references: [folders.id],
  }),
}));

export const threadFoldersRelations = relations(threadFolders, ({ one }) => ({
  thread: one(threads, {
    fields: [threadFolders.threadId],
    references: [threads.id],
  }),
  folder: one(folders, {
    fields: [threadFolders.folderId],
    references: [folders.id],
  }),
}));

export const filterRulesRelations = relations(filterRules, ({ many }) => ({
  actions: many(filterActions),
  processedEmails: many(processedEmails),
}));

export const filterActionsRelations = relations(filterActions, ({ one, many }) => ({
  rule: one(filterRules, {
    fields: [filterActions.ruleId],
    references: [filterRules.id],
  }),
  processedEmails: many(processedEmails),
}));

export const processedEmailsRelations = relations(processedEmails, ({ one }) => ({
  email: one(emails, {
    fields: [processedEmails.emailId],
    references: [emails.id],
  }),
  rule: one(filterRules, {
    fields: [processedEmails.ruleId],
    references: [filterRules.id],
  }),
  action: one(filterActions, {
    fields: [processedEmails.actionId],
    references: [filterActions.id],
  }),
}));
