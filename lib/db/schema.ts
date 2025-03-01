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
  customType,
} from 'drizzle-orm/pg-core';

const bytea = customType<{ data: string; notNull: false; default: false }>({
  dataType() {
    return "bytea";
  },
  toDriver(val: string): Buffer {
    let newVal = val;
    if (val.startsWith("0x")) {
      newVal = val.slice(2);
    }

    return Buffer.from(newVal, "hex");
  },
  fromDriver(val: any): string {
    return val.toString("hex");
  },
})

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
    avatarUrl: varchar('avatar_url', { length: 255 }),
  },
  (table) => {
    return {
      emailIndex: uniqueIndex('email_idx').on(table.email),
    };
  }
);

export const emails = pgTable(
  'emails',
  {
    id: serial('id').primaryKey(),
    fromEmail: varchar('from_email', { length: 255 }).notNull(),
    toEmail: varchar('to_email', { length: 255 }).notNull(),
    subject: varchar('subject', { length: 255 }),
    body: text('body'),
    isHtml: boolean('is_html').default(false),
    sentDate: timestamp('sent_date').defaultNow(),
    read: boolean('read').default(false),
  },
  (table) => {
    return {
      fromEmailIndex: index('from_email_idx').on(table.fromEmail),
      toEmailIndex: index('to_email_idx').on(table.toEmail),
      sentDateIndex: index('sent_date_idx').on(table.sentDate),
    };
  }
);

export const attachments = pgTable(
  'attachments',
  {
    id: serial('id').primaryKey(),
    emailId: integer('email_id').references(() => emails.id, { onDelete: 'cascade' }).notNull(),
    filename: varchar('filename', { length: 255 }).notNull(),
    contentType: varchar('content_type', { length: 100 }).notNull(),
    size: integer('size').notNull(),
    content: bytea('content').notNull(), // Binary content
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => {
    return {
      emailIdIndex: index('attachment_email_id_idx').on(table.emailId),
      filenameIndex: index('attachment_filename_idx').on(table.filename),
    };
  }
);

export const filterRules = pgTable('filter_rules', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  fromPattern: text('from_pattern'),
  toPattern: text('to_pattern'),
  subjectPattern: text('subject_pattern'),
  operator: varchar('operator', { length: 10 }).notNull().default('AND'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  enabled: boolean('enabled').default(true),
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

export const emailsRelations = relations(emails, ({ many }) => ({
  attachments: many(attachments),
}));

export const attachmentsRelations = relations(attachments, ({ one }) => ({
  email: one(emails, {
    fields: [attachments.emailId],
    references: [emails.id],
  }),
}));
