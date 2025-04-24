import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { properties, leadPurchases, payments, notifications, subscriptions } from "@shared/schema";
import { eq, and, desc, gte, lt, sql, inArray } from "drizzle-orm";
import { z } from "zod";
import { insertPropertySchema, insertLeadPurchaseSchema, insertPaymentSchema, insertSubscriptionSchema } from "@shared/schema";
import Stripe from "stripe";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize Stripe
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("Missing required Stripe secret key");
  }
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2023-10-16" as any,
  });

  // Set up authentication routes
  setupAuth(app);
  
  // Helper middleware to check authentication
  const isAuthenticated = (req: any, res: any, next: any) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Not authenticated" });
  };
  
  // Helper middleware to check role
  const hasRole = (roles: string[]) => (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    next();
  };
  
  //=====================================
  // Property/Lead Routes
  //=====================================
  
  // Create new property listing
  app.post("/api/properties", isAuthenticated, async (req, res) => {
    try {
      const data = insertPropertySchema.parse({
        ...req.body,
        sellerId: req.user.id,
        status: "active"
      });
      
      const property = await storage.createProperty(data);
      
      // Notify agents about new property
      // In a real app, we would query agents by location preference
      // For now, let's assume we have a fixed list of agent IDs
      const agents = await storage.getActiveSubscriptions();
      
      for (const subscription of agents) {
        await storage.createNotification({
          userId: subscription.agentId,
          title: "New Property Listing",
          message: `A new ${property.type} property is available in ${property.location} for $${property.price}.`,
          type: "new_property",
          linkUrl: `/agent/property/${property.id}`
        });
      }
      
      res.status(201).json(property);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create property listing" });
    }
  });
  
  // Get properties by seller
  app.get("/api/properties/my-listings", isAuthenticated, async (req, res) => {
    try {
      const properties = await storage.getPropertiesBySeller(req.user.id);
      res.json(properties);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch properties" });
    }
  });
  
  // Get filtered properties (for agents)
  app.get("/api/properties", hasRole(["agent", "admin"]), async (req, res) => {
    try {
      const { type, location, minPrice, maxPrice, status } = req.query;
      
      const filters: any = {};
      
      if (type && typeof type === "string") filters.type = type;
      if (location && typeof location === "string") filters.location = location;
      if (minPrice && typeof minPrice === "string") filters.minPrice = parseFloat(minPrice);
      if (maxPrice && typeof maxPrice === "string") filters.maxPrice = parseFloat(maxPrice);
      if (status && typeof status === "string") filters.status = status;
      
      const properties = await storage.getPropertiesByFilters(filters);
      res.json(properties);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch properties" });
    }
  });
  
  // Get single property by ID
  app.get("/api/properties/:id", isAuthenticated, async (req, res) => {
    try {
      const propertyId = parseInt(req.params.id);
      if (isNaN(propertyId)) {
        return res.status(400).json({ message: "Invalid property ID" });
      }
      
      const property = await storage.getProperty(propertyId);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      
      // Get seller information
      const seller = await storage.getUser(property.sellerId);
      if (!seller) {
        return res.status(404).json({ message: "Seller not found" });
      }
      
      // Create response object
      const propertyWithSeller = {
        ...property,
        seller: {
          id: seller.id,
          firstName: seller.firstName,
          lastName: seller.lastName,
          email: seller.email,
          phone: seller.phone,
          whatsappPreferred: seller.whatsappPreferred
        }
      };
      
      // If user is not the seller or an admin, check if they've purchased this lead
      if (property.sellerId !== req.user.id && req.user.role !== "admin") {
        // Check if this agent has purchased the lead
        const leadPurchase = await storage.getLeadPurchaseByAgentAndProperty(req.user.id, propertyId);
        
        if (!leadPurchase) {
          // Mask sensitive seller data for users who haven't purchased the lead
          propertyWithSeller.seller = {
            ...propertyWithSeller.seller,
            email: "********",
            phone: "********"
          };
        }
      }
      
      res.json(propertyWithSeller);
    } catch (error) {
      console.error("Error fetching property:", error);
      res.status(500).json({ message: "Failed to fetch property" });
    }
  });
  
  //=====================================
  // Lead Purchase Routes
  //=====================================
  
  // Purchase a lead
  app.post("/api/leads/purchase", hasRole(["agent"]), async (req, res) => {
    try {
      const { propertyId, price } = req.body;
      
      if (!propertyId || !price) {
        return res.status(400).json({ message: "Property ID and price are required" });
      }
      
      // Check if property exists
      const property = await storage.getProperty(propertyId);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      
      // Check if agent already purchased this lead
      const existingPurchases = await storage.getLeadPurchasesByAgent(req.user.id);
      const alreadyPurchased = existingPurchases.some(p => p.propertyId === propertyId);
      
      if (alreadyPurchased) {
        return res.status(400).json({ message: "You have already purchased this lead" });
      }
      
      // Check agent balance
      const agentProfile = await storage.getAgentProfile(req.user.id);
      if (!agentProfile) {
        return res.status(404).json({ message: "Agent profile not found" });
      }
      
      if (agentProfile.balance < price) {
        return res.status(400).json({ message: "Insufficient balance" });
      }
      
      // Process the purchase
      const leadPurchase = await storage.purchaseLead({
        agentId: req.user.id,
        propertyId,
        price,
        purchaseDate: new Date(),
        contacted: false,
        status: "pending"
      });
      
      // Update agent balance
      await storage.updateAgentProfile(req.user.id, {
        balance: agentProfile.balance - price
      });
      
      // Create payment record
      await storage.createPayment({
        userId: req.user.id,
        amount: price,
        method: "ecocash", // Default method
        status: "completed",
        description: `Lead purchase for property #${propertyId}`,
        leadPurchaseId: leadPurchase.id
      });
      
      // Notify seller
      await storage.createNotification({
        userId: property.sellerId,
        title: "Lead Purchased",
        message: "An agent has purchased your property listing and will contact you soon.",
        type: "lead_purchase",
        linkUrl: `/seller/property/${propertyId}`
      });
      
      res.status(201).json(leadPurchase);
    } catch (error) {
      res.status(500).json({ message: "Failed to purchase lead" });
    }
  });
  
  // Get leads purchased by agent
  app.get("/api/leads/purchased", hasRole(["agent"]), async (req, res) => {
    try {
      const purchases = await storage.getLeadPurchasesByAgent(req.user.id);
      res.json(purchases);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch purchased leads" });
    }
  });
  
  // Update lead status (contacted, etc.)
  app.patch("/api/leads/:id", hasRole(["agent"]), async (req, res) => {
    try {
      const leadId = parseInt(req.params.id);
      if (isNaN(leadId)) {
        return res.status(400).json({ message: "Invalid lead ID" });
      }
      
      const { contacted, status, sellerRating, feedback } = req.body;
      
      // Validate that this lead belongs to the agent
      const lead = await storage.getLeadPurchase(leadId);
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      
      if (lead.agentId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      // Update the lead
      const updatedLead = await storage.getLeadPurchase(leadId);
      if (!updatedLead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      
      res.json(updatedLead);
    } catch (error) {
      res.status(500).json({ message: "Failed to update lead" });
    }
  });
  
  //=====================================
  // Subscription Routes
  //=====================================
  
  // Create or update subscription
  app.post("/api/subscriptions", hasRole(["agent"]), async (req, res) => {
    try {
      const { type, price, months } = req.body;
      
      if (!type || !price || !months) {
        return res.status(400).json({ message: "Type, price, and duration are required" });
      }
      
      // Check if agent already has an active subscription
      const existingSubscription = await storage.getAgentSubscription(req.user.id);
      
      // Calculate end date
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + months);
      
      let subscription;
      
      if (existingSubscription) {
        // Update existing subscription
        subscription = await storage.updateSubscription(existingSubscription.id, {
          type,
          price,
          endDate,
          isActive: true
        });
      } else {
        // Create new subscription
        subscription = await storage.createSubscription({
          agentId: req.user.id,
          type,
          price,
          startDate: new Date(),
          endDate,
          isActive: true,
          autoRenew: true
        });
      }
      
      res.status(201).json(subscription);
    } catch (error) {
      res.status(500).json({ message: "Failed to process subscription" });
    }
  });
  
  // Get agent's active subscription
  app.get("/api/subscriptions/current", hasRole(["agent"]), async (req, res) => {
    try {
      const subscription = await storage.getAgentSubscription(req.user.id);
      if (!subscription) {
        return res.status(404).json({ message: "No active subscription found" });
      }
      
      res.json(subscription);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch subscription" });
    }
  });

  // Create Stripe subscription for payment
  app.post("/api/create-subscription", hasRole(["agent"]), async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { planType, price, months } = req.body;

      if (!planType || !price) {
        return res.status(400).json({ message: "Plan type and price are required" });
      }

      // Get the agent profile to include name
      const agentProfile = await storage.getAgentProfile(req.user.id);
      
      // Create the payment intent with Stripe
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(price * 100), // Convert to cents
        currency: "usd",
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          userId: req.user.id.toString(),
          planType,
          months: months.toString(),
          description: `${planType} subscription (${months} month${months > 1 ? 's' : ''})`
        },
      });

      res.json({
        clientSecret: paymentIntent.client_secret,
      });
    } catch (error: any) {
      console.error("Stripe error:", error);
      res.status(500).json({ message: error.message || "Failed to create payment intent" });
    }
  });

  // Stripe webhook for handling payment completions
  app.post("/api/webhook", express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers["stripe-signature"] as string;

    let event;

    try {
      // Parse the webhook payload
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET || ""
      );
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case "payment_intent.succeeded":
        const paymentIntent = event.data.object;
        const { userId, planType, months, description } = paymentIntent.metadata;

        // Create or update subscription
        if (userId && planType && months) {
          const user = await storage.getUser(parseInt(userId));
          if (user && user.role === "agent") {
            // Calculate end date
            const endDate = new Date();
            endDate.setMonth(endDate.getMonth() + parseInt(months));

            // Check for existing subscription
            const existingSubscription = await storage.getAgentSubscription(parseInt(userId));
            
            // Create or update subscription
            if (existingSubscription) {
              await storage.updateSubscription(existingSubscription.id, {
                type: planType as any,
                price: paymentIntent.amount / 100, // Convert from cents
                endDate,
                isActive: true
              });
            } else {
              await storage.createSubscription({
                agentId: parseInt(userId),
                type: planType as any,
                price: paymentIntent.amount / 100, // Convert from cents
                startDate: new Date(),
                endDate,
                isActive: true,
                autoRenew: true
              });
            }
            
            // Create payment record
            await storage.createPayment({
              userId: parseInt(userId),
              amount: paymentIntent.amount / 100,
              method: "stripe" as any,
              status: "completed",
              description: description || `Subscription payment: ${planType}`,
            });
            
            // Create notification
            await storage.createNotification({
              userId: parseInt(userId),
              title: "Subscription Activated",
              message: `Your ${planType.replace('_', ' ')} subscription has been activated and is valid until ${endDate.toLocaleDateString()}.`,
              type: "subscription_activated"
            });
          }
        }
        break;
        
      case "payment_intent.payment_failed":
        const failedPaymentIntent = event.data.object;
        // You can handle failed payments here
        break;
        
      default:
        // Unexpected event type
        console.log(`Unhandled event type ${event.type}`);
    }

    // Return a 200 response to acknowledge receipt of the event
    res.json({ received: true });
  });
  
  //=====================================
  // Payment Routes
  //=====================================
  
  // Process payment (top up agent balance)
  app.post("/api/payments", isAuthenticated, async (req, res) => {
    try {
      const { amount, method, description } = req.body;
      
      if (!amount || !method) {
        return res.status(400).json({ message: "Amount and payment method are required" });
      }
      
      // Create the payment record
      const payment = await storage.createPayment({
        userId: req.user.id,
        amount,
        method,
        status: "completed", // In a real app, this would be "pending" until confirmed
        description: description || "Account top-up",
      });
      
      // If the payment is for an agent, update their balance
      if (req.user.role === "agent") {
        const agentProfile = await storage.getAgentProfile(req.user.id);
        if (agentProfile) {
          await storage.updateAgentProfile(req.user.id, {
            balance: agentProfile.balance + amount
          });
        }
      }
      
      res.status(201).json(payment);
    } catch (error) {
      res.status(500).json({ message: "Failed to process payment" });
    }
  });
  
  // Get user's payment history
  app.get("/api/payments/history", isAuthenticated, async (req, res) => {
    try {
      const payments = await storage.getPaymentsByUser(req.user.id);
      res.json(payments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch payment history" });
    }
  });
  
  //=====================================
  // Notification Routes
  //=====================================
  
  // Get user's notifications
  app.get("/api/notifications", isAuthenticated, async (req, res) => {
    try {
      const notifications = await storage.getNotificationsByUser(req.user.id);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });
  
  // Mark notification as read
  app.patch("/api/notifications/:id", isAuthenticated, async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      if (isNaN(notificationId)) {
        return res.status(400).json({ message: "Invalid notification ID" });
      }
      
      const notification = await storage.markNotificationAsRead(notificationId);
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }
      
      res.json(notification);
    } catch (error) {
      res.status(500).json({ message: "Failed to update notification" });
    }
  });
  
  //=====================================
  // Admin Routes
  //=====================================
  
  // Get pending agent verifications
  app.get("/api/admin/agent-verifications", hasRole(["admin"]), async (req, res) => {
    try {
      const pendingAgents = await storage.getPendingAgentProfiles();
      res.json(pendingAgents);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pending verifications" });
    }
  });
  
  // Approve or reject agent verification
  app.patch("/api/admin/agent-verifications/:id", hasRole(["admin"]), async (req, res) => {
    try {
      const agentId = parseInt(req.params.id);
      if (isNaN(agentId)) {
        return res.status(400).json({ message: "Invalid agent ID" });
      }
      
      const { status, note } = req.body;
      
      if (!status || !["approved", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Valid status (approved or rejected) is required" });
      }
      
      // Get the agent profile
      const agentProfile = await storage.getAgentProfile(agentId);
      if (!agentProfile) {
        return res.status(404).json({ message: "Agent profile not found" });
      }
      
      // Update the verification status
      const updatedProfile = await storage.updateAgentProfile(agentId, {
        verificationStatus: status,
        verificationDate: new Date(),
        verificationNote: note || ""
      });
      
      // Notify the agent
      const notificationTitle = status === "approved" 
        ? "Account Verification Approved" 
        : "Account Verification Rejected";
      
      const notificationMessage = status === "approved"
        ? "Your agent account has been verified. You can now purchase leads."
        : `Your agent account verification was rejected. Reason: ${note || "No reason provided"}`;
      
      await storage.createNotification({
        userId: agentId,
        title: notificationTitle,
        message: notificationMessage,
        type: "verification_update"
      });
      
      res.json(updatedProfile);
    } catch (error) {
      res.status(500).json({ message: "Failed to update verification status" });
    }
  });
  
  // Get system statistics
  app.get("/api/admin/stats", hasRole(["admin"]), async (req, res) => {
    try {
      const stats = await storage.getSystemStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch system statistics" });
    }
  });
  
  const httpServer = createServer(app);
  return httpServer;
}
