import { pgTable, text, serial, integer, boolean, timestamp, json, varchar, doublePrecision, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Enum for user roles
export const userRoleEnum = pgEnum('user_role', ['seller', 'agent', 'admin']);

// Enum for property types
export const propertyTypeEnum = pgEnum('property_type', ['residential', 'commercial', 'land', 'apartment']);

// Enum for lead statuses
export const leadStatusEnum = pgEnum('lead_status', ['pending', 'active', 'expired', 'archived']);

// Enum for agent verification status
export const verificationStatusEnum = pgEnum('verification_status', ['pending', 'approved', 'rejected']);

// Enum for payment methods
export const paymentMethodEnum = pgEnum('payment_method', ['ecocash', 'bank_transfer', 'cash', 'stripe']);

// Enum for subscription types
export const subscriptionTypeEnum = pgEnum('subscription_type', ['pay_per_lead', 'unlimited']);

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  phone: text("phone").notNull(),
  role: userRoleEnum("role").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  whatsappPreferred: boolean("whatsapp_preferred").default(false),
});

// User Profile for Agents
export const agentProfiles = pgTable("agent_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  agencyName: text("agency_name").notNull(),
  licenseDocument: text("license_document").notNull(),
  verificationStatus: verificationStatusEnum("verification_status").default("pending").notNull(),
  verificationDate: timestamp("verification_date"),
  verificationNote: text("verification_note"),
  rating: integer("rating"),
  balance: doublePrecision("balance").default(0).notNull(),
});

// Properties/Leads
export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  sellerId: integer("seller_id").references(() => users.id).notNull(),
  type: propertyTypeEnum("type").notNull(),
  location: text("location").notNull(),
  address: text("address").notNull(),
  price: doublePrecision("price").notNull(),
  size: doublePrecision("size"),
  description: text("description").notNull(),
  photos: json("photos").$type<string[]>().default([]),
  status: leadStatusEnum("status").default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
  isVerified: boolean("is_verified").default(false),
});

// Agent Lead Purchases
export const leadPurchases = pgTable("lead_purchases", {
  id: serial("id").primaryKey(),
  agentId: integer("agent_id").references(() => users.id).notNull(),
  propertyId: integer("property_id").references(() => properties.id).notNull(),
  purchaseDate: timestamp("purchase_date").defaultNow().notNull(),
  price: doublePrecision("price").notNull(),
  contacted: boolean("contacted").default(false),
  status: text("status").default("pending"),
  sellerRating: integer("seller_rating"),
  feedback: text("feedback"),
});

// Subscriptions
export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  agentId: integer("agent_id").references(() => users.id).notNull(),
  type: subscriptionTypeEnum("type").notNull(),
  price: doublePrecision("price").notNull(),
  startDate: timestamp("start_date").defaultNow().notNull(),
  endDate: timestamp("end_date").notNull(),
  isActive: boolean("is_active").default(true),
  autoRenew: boolean("auto_renew").default(true),
});

// Payments
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  amount: doublePrecision("amount").notNull(),
  method: paymentMethodEnum("method").notNull(),
  status: text("status").default("pending"),
  referenceId: text("reference_id"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  subscriptionId: integer("subscription_id").references(() => subscriptions.id),
  leadPurchaseId: integer("lead_purchase_id").references(() => leadPurchases.id),
});

// System Notifications
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(),
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  linkUrl: text("link_url"),
});

// Define relationships
export const usersRelations = relations(users, ({ many, one }) => ({
  agentProfile: one(agentProfiles, {
    fields: [users.id],
    references: [agentProfiles.userId],
  }),
  properties: many(properties),
  leadPurchases: many(leadPurchases),
  subscriptions: many(subscriptions),
  payments: many(payments),
  notifications: many(notifications),
}));

export const agentProfilesRelations = relations(agentProfiles, ({ one }) => ({
  user: one(users, {
    fields: [agentProfiles.userId],
    references: [users.id],
  }),
}));

export const propertiesRelations = relations(properties, ({ one, many }) => ({
  seller: one(users, {
    fields: [properties.sellerId],
    references: [users.id],
  }),
  purchases: many(leadPurchases),
}));

export const leadPurchasesRelations = relations(leadPurchases, ({ one, many }) => ({
  agent: one(users, {
    fields: [leadPurchases.agentId],
    references: [users.id],
  }),
  property: one(properties, {
    fields: [leadPurchases.propertyId],
    references: [properties.id],
  }),
  payments: many(payments),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one, many }) => ({
  agent: one(users, {
    fields: [subscriptions.agentId],
    references: [users.id],
  }),
  payments: many(payments),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  user: one(users, {
    fields: [payments.userId],
    references: [users.id],
  }),
  subscription: one(subscriptions, {
    fields: [payments.subscriptionId],
    references: [subscriptions.id],
  }),
  leadPurchase: one(leadPurchases, {
    fields: [payments.leadPurchaseId],
    references: [leadPurchases.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users, {
  email: (schema) => schema.email("Please enter a valid email"),
  password: (schema) => schema.min(6, "Password must be at least 6 characters"),
  phone: (schema) => schema.min(9, "Please enter a valid phone number"),
});

export const insertPropertySchema = createInsertSchema(properties, {
  description: (schema) => schema.min(10, "Description must be at least 10 characters"),
  price: (schema) => schema.min(1, "Price must be greater than 0"),
});

export const insertAgentProfileSchema = createInsertSchema(agentProfiles);
export const insertLeadPurchaseSchema = createInsertSchema(leadPurchases);
export const insertSubscriptionSchema = createInsertSchema(subscriptions);
export const insertPaymentSchema = createInsertSchema(payments);
export const insertNotificationSchema = createInsertSchema(notifications);

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type AgentProfile = typeof agentProfiles.$inferSelect;
export type InsertAgentProfile = z.infer<typeof insertAgentProfileSchema>;

export type Property = typeof properties.$inferSelect;
export type InsertProperty = z.infer<typeof insertPropertySchema>;

export type LeadPurchase = typeof leadPurchases.$inferSelect;
export type InsertLeadPurchase = z.infer<typeof insertLeadPurchaseSchema>;

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

// Authentication types
export type LoginData = {
  username: string;
  password: string;
};

export type RegisterData = InsertUser;
