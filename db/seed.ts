import { db } from "./index";
import * as schema from "@shared/schema";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function seed() {
  try {
    console.log("Starting database seed...");
    
    // Check if admin user exists
    const existingAdmin = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.username, "admin")
    });
    
    if (!existingAdmin) {
      console.log("Creating admin user...");
      const [admin] = await db.insert(schema.users).values({
        username: "admin",
        password: await hashPassword("admin123"),
        email: "admin@zimproperty.co.zw",
        firstName: "System",
        lastName: "Administrator",
        phone: "+263771234567",
        role: "admin",
        whatsappPreferred: false
      }).returning();
      
      console.log(`Admin user created with ID: ${admin.id}`);
    } else {
      console.log("Admin user already exists, skipping creation");
    }
    
    // Check if we have any demo sellers
    const existingSeller = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.username, "seller")
    });
    
    if (!existingSeller) {
      console.log("Creating demo seller user...");
      const [seller] = await db.insert(schema.users).values({
        username: "seller",
        password: await hashPassword("seller123"),
        email: "seller@example.com",
        firstName: "Tendai",
        lastName: "Moyo",
        phone: "+263772345678",
        role: "seller",
        whatsappPreferred: true
      }).returning();
      
      console.log(`Demo seller created with ID: ${seller.id}`);
      
      // Create a couple of properties for the demo seller
      const properties = [
        {
          sellerId: seller.id,
          type: "residential",
          location: "harare",
          address: "123 Borrowdale Road, Borrowdale, Harare",
          price: 120000,
          size: 350,
          description: "Beautiful 3 bedroom house in Borrowdale with modern finishes, swimming pool, and spacious garden.",
          photos: [],
          status: "active",
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        },
        {
          sellerId: seller.id,
          type: "commercial",
          location: "harare",
          address: "45 Samora Machel Avenue, CBD, Harare",
          price: 85000,
          size: 120,
          description: "Prime commercial space in Harare CBD, suitable for retail or office use. High foot traffic area.",
          photos: [],
          status: "active",
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      ];
      
      await db.insert(schema.properties).values(properties);
      console.log("Demo properties created for seller");
    }
    
    // Check if we have any demo agents
    const existingAgent = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.username, "agent")
    });
    
    if (!existingAgent) {
      console.log("Creating demo agent user...");
      const [agent] = await db.insert(schema.users).values({
        username: "agent",
        password: await hashPassword("agent123"),
        email: "agent@example.com",
        firstName: "Faith",
        lastName: "Chieza",
        phone: "+263773456789",
        role: "agent",
        whatsappPreferred: false
      }).returning();
      
      console.log(`Demo agent created with ID: ${agent.id}`);
      
      // Create agent profile
      await db.insert(schema.agentProfiles).values({
        userId: agent.id,
        agencyName: "HomeFinders Zimbabwe",
        licenseDocument: "license-document-placeholder.pdf",
        verificationStatus: "approved",
        verificationDate: new Date(),
        balance: 500
      });
      
      console.log("Demo agent profile created");
      
      // Create subscription for agent
      await db.insert(schema.subscriptions).values({
        agentId: agent.id,
        type: "unlimited",
        price: 100,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        isActive: true,
        autoRenew: true
      });
      
      console.log("Demo subscription created for agent");
    }
    
    console.log("Seed completed successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
}

seed();
