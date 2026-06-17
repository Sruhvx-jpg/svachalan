import { pgTable, text, timestamp, boolean, jsonb } from 'drizzle-orm/pg-core';

export const chatSessions = pgTable('chat_sessions', {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(),
    title: text('title').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const chatMessages = pgTable('chat_messages', {
    id: text('id').primaryKey(),
    sessionId: text('session_id').notNull().references(() => chatSessions.id, { onDelete: 'cascade' }),
    role: text('role').notNull(), // 'user' | 'ai'
    content: text('content'),
    needsConfirmation: boolean('needs_confirmation').default(false),
    confirmationDetails: jsonb('confirmation_details'),
    isConfirmed: boolean('is_confirmed').default(false),
    isDeclined: boolean('is_declined').default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
