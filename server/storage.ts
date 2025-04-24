import { db } from '@db';
import { users, properties, leadPurchases, subscriptions, payments, notifications, agentProfiles } from '@shared/schema';
import { InsertUser, User, InsertProperty, Property, AgentProfile, InsertAgentProfile, LeadPurchase, InsertLeadPurchase, Subscription, InsertSubscription, Payment, InsertPayment, Notification, InsertNotification } from '@shared/schema';
import { eq, and, desc, gte, lt, sql, inArray } from 'drizzle-orm';
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from '@db';

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User operations
  createUser(user: InsertUser): Promise<User>;
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined>;
  
  // Property/Lead operations
  createProperty(property: InsertProperty): Promise<Property>;
  getProperty(id: number): Promise<Property | undefined>;
  getPropertiesBySeller(sellerId: number): Promise<Property[]>;
  getPropertiesByFilters(filters: {
    type?: string;
    location?: string;
    minPrice?: number;
    maxPrice?: number;
    status?: string;
  }): Promise<Property[]>;
  updateProperty(id: number, data: Partial<InsertProperty>): Promise<Property | undefined>;
  
  // Agent profile operations
  createAgentProfile(profile: InsertAgentProfile): Promise<AgentProfile>;
  getAgentProfile(userId: number): Promise<AgentProfile | undefined>;
  updateAgentProfile(userId: number, data: Partial<InsertAgentProfile>): Promise<AgentProfile | undefined>;
  getPendingAgentProfiles(): Promise<(AgentProfile & { user: User })[]>;
  
  // Lead purchase operations
  purchaseLead(data: InsertLeadPurchase): Promise<LeadPurchase>;
  getLeadPurchasesByAgent(agentId: number): Promise<(LeadPurchase & { property: Property })[]>;
  getLeadPurchase(id: number): Promise<LeadPurchase | undefined>;
  
  // Subscription operations
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  getAgentSubscription(agentId: number): Promise<Subscription | undefined>;
  getActiveSubscriptions(): Promise<Subscription[]>;
  updateSubscription(id: number, data: Partial<InsertSubscription>): Promise<Subscription | undefined>;
  
  // Payment operations
  createPayment(payment: InsertPayment): Promise<Payment>;
  getPaymentsByUser(userId: number): Promise<Payment[]>;
  updatePayment(id: number, data: Partial<InsertPayment>): Promise<Payment | undefined>;
  
  // Notification operations
  createNotification(notification: InsertNotification): Promise<Notification>;
  getNotificationsByUser(userId: number): Promise<Notification[]>;
  markNotificationAsRead(id: number): Promise<Notification | undefined>;
  
  // System operations
  getSystemStats(): Promise<{
    pendingAgents: number;
    activeLeads: number;
    leadPurchases: number;
    totalRevenue: number;
  }>;
  
  // Session store
  sessionStore: session.SessionStore;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;
  
  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool,
      createTableIfMissing: true 
    });
  }
  
  // User operations
  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }
  
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.query.users.findFirst({
      where: eq(users.id, id)
    });
    return result;
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.query.users.findFirst({
      where: eq(users.username, username)
    });
    return result;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.query.users.findFirst({
      where: eq(users.email, email)
    });
    return result;
  }
  
  async updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined> {
    const [updatedUser] = await db.update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }
  
  // Property/Lead operations
  async createProperty(property: InsertProperty): Promise<Property> {
    // Set the property to expire in 30 days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    
    const [newProperty] = await db.insert(properties)
      .values({
        ...property,
        expiresAt
      })
      .returning();
    return newProperty;
  }
  
  async getProperty(id: number): Promise<Property | undefined> {
    const result = await db.query.properties.findFirst({
      where: eq(properties.id, id),
      with: {
        seller: true
      }
    });
    return result;
  }
  
  async getPropertiesBySeller(sellerId: number): Promise<Property[]> {
    const results = await db.query.properties.findMany({
      where: eq(properties.sellerId, sellerId),
      orderBy: [desc(properties.createdAt)]
    });
    return results;
  }
  
  async getPropertiesByFilters(filters: {
    type?: string;
    location?: string;
    minPrice?: number;
    maxPrice?: number;
    status?: string;
  }): Promise<Property[]> {
    let query = db.select().from(properties);
    
    if (filters.type && filters.type !== 'all') {
      query = query.where(eq(properties.type, filters.type));
    }
    
    if (filters.location && filters.location !== 'all') {
      query = query.where(eq(properties.location, filters.location));
    }
    
    if (filters.minPrice) {
      query = query.where(gte(properties.price, filters.minPrice));
    }
    
    if (filters.maxPrice) {
      query = query.where(lt(properties.price, filters.maxPrice));
    }
    
    if (filters.status) {
      query = query.where(eq(properties.status, filters.status));
    }
    
    const results = await query.orderBy(desc(properties.createdAt));
    return results;
  }
  
  async updateProperty(id: number, data: Partial<InsertProperty>): Promise<Property | undefined> {
    const [updatedProperty] = await db.update(properties)
      .set(data)
      .where(eq(properties.id, id))
      .returning();
    return updatedProperty;
  }
  
  // Agent profile operations
  async createAgentProfile(profile: InsertAgentProfile): Promise<AgentProfile> {
    const [newProfile] = await db.insert(agentProfiles).values(profile).returning();
    return newProfile;
  }
  
  async getAgentProfile(userId: number): Promise<AgentProfile | undefined> {
    const result = await db.query.agentProfiles.findFirst({
      where: eq(agentProfiles.userId, userId)
    });
    return result;
  }
  
  async updateAgentProfile(userId: number, data: Partial<InsertAgentProfile>): Promise<AgentProfile | undefined> {
    const [updatedProfile] = await db.update(agentProfiles)
      .set(data)
      .where(eq(agentProfiles.userId, userId))
      .returning();
    return updatedProfile;
  }
  
  async getPendingAgentProfiles(): Promise<(AgentProfile & { user: User })[]> {
    const results = await db.query.agentProfiles.findMany({
      where: eq(agentProfiles.verificationStatus, 'pending'),
      with: {
        user: true
      },
      orderBy: [desc(agentProfiles.id)]
    });
    return results;
  }
  
  // Lead purchase operations
  async purchaseLead(data: InsertLeadPurchase): Promise<LeadPurchase> {
    const [newPurchase] = await db.insert(leadPurchases).values(data).returning();
    return newPurchase;
  }
  
  async getLeadPurchasesByAgent(agentId: number): Promise<(LeadPurchase & { property: Property })[]> {
    const results = await db.query.leadPurchases.findMany({
      where: eq(leadPurchases.agentId, agentId),
      with: {
        property: true
      },
      orderBy: [desc(leadPurchases.purchaseDate)]
    });
    return results;
  }
  
  async getLeadPurchase(id: number): Promise<LeadPurchase | undefined> {
    const result = await db.query.leadPurchases.findFirst({
      where: eq(leadPurchases.id, id),
      with: {
        property: true,
        agent: true
      }
    });
    return result;
  }
  
  // Subscription operations
  async createSubscription(subscription: InsertSubscription): Promise<Subscription> {
    const [newSubscription] = await db.insert(subscriptions).values(subscription).returning();
    return newSubscription;
  }
  
  async getAgentSubscription(agentId: number): Promise<Subscription | undefined> {
    const result = await db.query.subscriptions.findFirst({
      where: and(
        eq(subscriptions.agentId, agentId),
        eq(subscriptions.isActive, true)
      )
    });
    return result;
  }
  
  async getActiveSubscriptions(): Promise<Subscription[]> {
    const results = await db.query.subscriptions.findMany({
      where: eq(subscriptions.isActive, true)
    });
    return results;
  }
  
  async updateSubscription(id: number, data: Partial<InsertSubscription>): Promise<Subscription | undefined> {
    const [updatedSubscription] = await db.update(subscriptions)
      .set(data)
      .where(eq(subscriptions.id, id))
      .returning();
    return updatedSubscription;
  }
  
  // Payment operations
  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [newPayment] = await db.insert(payments).values(payment).returning();
    return newPayment;
  }
  
  async getPaymentsByUser(userId: number): Promise<Payment[]> {
    const results = await db.query.payments.findMany({
      where: eq(payments.userId, userId),
      orderBy: [desc(payments.createdAt)]
    });
    return results;
  }
  
  async updatePayment(id: number, data: Partial<InsertPayment>): Promise<Payment | undefined> {
    const [updatedPayment] = await db.update(payments)
      .set(data)
      .where(eq(payments.id, id))
      .returning();
    return updatedPayment;
  }
  
  // Notification operations
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db.insert(notifications).values(notification).returning();
    return newNotification;
  }
  
  async getNotificationsByUser(userId: number): Promise<Notification[]> {
    const results = await db.query.notifications.findMany({
      where: eq(notifications.userId, userId),
      orderBy: [desc(notifications.createdAt)]
    });
    return results;
  }
  
  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    const [updatedNotification] = await db.update(notifications)
      .set({ read: true })
      .where(eq(notifications.id, id))
      .returning();
    return updatedNotification;
  }
  
  // System operations
  async getSystemStats(): Promise<{
    pendingAgents: number;
    activeLeads: number;
    leadPurchases: number;
    totalRevenue: number;
  }> {
    const pendingAgentsResult = await db.select({ count: sql<number>`count(*)` })
      .from(agentProfiles)
      .where(eq(agentProfiles.verificationStatus, 'pending'));
    
    const activeLeadsResult = await db.select({ count: sql<number>`count(*)` })
      .from(properties)
      .where(eq(properties.status, 'active'));
    
    const leadPurchasesResult = await db.select({ count: sql<number>`count(*)` })
      .from(leadPurchases);
    
    const totalRevenueResult = await db.select({ sum: sql<number>`COALESCE(SUM(amount), 0)` })
      .from(payments)
      .where(eq(payments.status, 'completed'));
    
    return {
      pendingAgents: pendingAgentsResult[0].count || 0,
      activeLeads: activeLeadsResult[0].count || 0,
      leadPurchases: leadPurchasesResult[0].count || 0,
      totalRevenue: totalRevenueResult[0].sum || 0
    };
  }
}

export const storage = new DatabaseStorage();
