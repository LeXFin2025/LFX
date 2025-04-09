import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  email: text("email").notNull().unique(),
  jurisdiction: text("jurisdiction").default("USA"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  firstName: true,
  lastName: true,
  email: true,
  jurisdiction: true,
});

// Document status types
export const DocumentStatusEnum = z.enum(["pending", "processing", "completed", "failed"]);
export type DocumentStatus = z.infer<typeof DocumentStatusEnum>;

// Service category types
export const ServiceCategoryEnum = z.enum(["forensic", "tax", "legal"]);
export type ServiceCategory = z.infer<typeof ServiceCategoryEnum>;

// Document analysis result type
export const AnalysisResultSchema = z.object({
  analysis: z.array(z.string()).optional(),
  recommendations: z.array(z.string()).optional(),
  references: z.array(z.object({
    title: z.string(),
    url: z.string().optional()
  })).optional(),
  lexIntuition: z.object({
    predictions: z.array(z.string()).optional(),
    risks: z.array(z.object({
      title: z.string(),
      description: z.string()
    })).optional(),
    opportunities: z.array(z.object({
      title: z.string(),
      description: z.string()
    })).optional()
  }).optional(),
  reasoningLog: z.array(z.object({
    step: z.string(),
    reasoning: z.string()
  })).optional()
}).optional();

export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;

// Documents table
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  filename: text("filename").notNull(),
  category: text("category", { enum: ["forensic", "tax", "legal"] }).notNull(),
  uploadDate: timestamp("upload_date").defaultNow().notNull(),
  status: text("status", { enum: ["pending", "processing", "completed", "failed"] }).default("pending").notNull(),
  analysisResult: jsonb("analysis_result"),
});

export const insertDocumentSchema = createInsertSchema(documents).pick({
  userId: true,
  filename: true,
  category: true,
});

// Activities table
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type", { enum: ["upload", "analysis", "lexassist", "lexintuition", "login"] }).notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  details: jsonb("details"),
  relatedDocumentId: integer("related_document_id"),
});

export const insertActivitySchema = createInsertSchema(activities).pick({
  userId: true,
  type: true,
  details: true,
  relatedDocumentId: true,
});

// Conversations with LeXAssist
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  lastMessageAt: timestamp("last_message_at").defaultNow().notNull(),
  closed: boolean("closed").default(false),
});

export const insertConversationSchema = createInsertSchema(conversations).pick({
  userId: true,
});

// Messages within a conversation
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull(),
  sender: text("sender", { enum: ["user", "assistant"] }).notNull(),
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  reasoningLog: jsonb("reasoning_log"),
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  conversationId: true,
  sender: true,
  content: true,
  reasoningLog: true,
});

// Export the types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;

export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
