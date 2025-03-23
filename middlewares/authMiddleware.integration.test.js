import { requireSignIn, isAdmin } from "./authMiddleware.js";
import JWT from "jsonwebtoken";
import userModel from "../models/userModel.js";
import mongoose from "mongoose";
import dotenv from "dotenv";
import express from "express";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";

dotenv.config();

jest.unmock("jsonwebtoken");
jest.unmock("../models/userModel.js");

// Setup test application
const app = express();
app.use(express.json());

// Test route with both middleware functions
app.get('/test/admin', requireSignIn, isAdmin, (req, res) => {
  res.status(200).json({ success: true, user: req.user });
});

// Test route with just requireSignIn
app.get('/test/user', requireSignIn, (req, res) => {
  res.status(200).json({ success: true, user: req.user });
});

describe("Authentication Middleware Integration Tests", () => {
  let mongoServer;
  let adminUserId;
  let regularUserId;
  let adminToken;
  let regularToken;
  let expiredToken;

  // Set up in-memory MongoDB server and create test users
  beforeAll(async () => {
    // Create in-memory MongoDB server
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // Connect to in-memory database
    await mongoose.connect(mongoUri);
    
    // Create test users in the database with all required fields
    const adminUser = new userModel({
      name: "Admin User",
      email: "admin@test.com",
      password: "hashed-password-for-admin",
      phone: "1234567890",
      address: "123 Admin Street",
      answer: "admin security answer",
      role: 1, // Admin role
    });
    await adminUser.save();
    adminUserId = adminUser._id;
    
    const regularUser = new userModel({
      name: "Regular User",
      email: "user@test.com",
      password: "hashed-password-for-user",
      phone: "0987654321",
      address: "456 User Avenue",
      answer: "user security answer",
      role: 0, // Regular user role
    });
    await regularUser.save();
    regularUserId = regularUser._id;
    
    // Generate JWT tokens
    adminToken = JWT.sign({ _id: adminUserId }, process.env.JWT_SECRET);
    regularToken = JWT.sign({ _id: regularUserId }, process.env.JWT_SECRET);
    
    // Generate an expired token
    expiredToken = JWT.sign(
      { _id: regularUserId }, 
      process.env.JWT_SECRET, 
      { expiresIn: '1ms' } // Expires immediately
    );
    
    // Small delay to ensure token is expired
    await new Promise(resolve => setTimeout(resolve, 100));
  });
  
  // Disconnect and clean up after tests
  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  describe("End-to-End Authentication Flow", () => {
    test("admin user should access admin-protected route", async () => {
      const response = await request(app)
        .get('/test/admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.user._id).toBe(adminUserId.toString());
    });
    
    test("regular user should be denied access to admin-protected route", async () => {
      const response = await request(app)
        .get('/test/admin')
        .set('Authorization', `Bearer ${regularToken}`)
        .expect(403);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Forbidden: Admin privileges required");
    });
    
    test("both admin and regular users should access user-protected route", async () => {
      // Admin access
      const adminResponse = await request(app)
        .get('/test/user')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      
      expect(adminResponse.body.success).toBe(true);
      
      // Regular user access
      const userResponse = await request(app)
        .get('/test/user')
        .set('Authorization', `Bearer ${regularToken}`)
        .expect(200);
      
      expect(userResponse.body.success).toBe(true);
    });
  });

  describe("Edge Cases & Failures", () => {
    test("should reject requests with expired tokens", async () => {
      const response = await request(app)
        .get('/test/user')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Token has expired, please login again");
    });
    
    test("should reject requests with malformed tokens", async () => {
      const response = await request(app)
        .get('/test/user')
        .set('Authorization', 'Bearer malformed.token.value')
        .expect(401);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Invalid or expired token");
    });
    
    test("should reject requests with missing authorization header", async () => {
      const response = await request(app)
        .get('/test/user')
        .expect(401);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Authentication required");
    });

    test("should reject requests with non-Bearer format", async () => {
      const response = await request(app)
        .get('/test/user')
        .set('Authorization', `JWT ${regularToken}`)
        .expect(401);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Invalid token format");
    });
  });

  describe("Database Integration", () => {
    test("should verify admin role directly from the database", async () => {
      // First make a successful request to confirm the admin role works
      await request(app)
        .get('/test/admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      
      // Now change the user's role in the database
      await userModel.findByIdAndUpdate(adminUserId, { role: 0 });
      
      // The middleware should now reject the admin request
      const response = await request(app)
        .get('/test/admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(403);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Forbidden: Admin privileges required");
      
      // Restore the admin role for other tests
      await userModel.findByIdAndUpdate(adminUserId, { role: 1 });
    });
    
    test("should handle non-existent user IDs", async () => {
      // Create token with non-existent user ID
      const nonExistentId = new mongoose.Types.ObjectId();
      const nonExistentToken = JWT.sign({ _id: nonExistentId }, process.env.JWT_SECRET);
      
      const response = await request(app)
        .get('/test/admin')
        .set('Authorization', `Bearer ${nonExistentToken}`)
        .expect(404);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("User not found");
    });

    test("should handle invalid ObjectId in token", async () => {
      // Create token with invalid ObjectId
      const invalidToken = JWT.sign({ _id: "not-a-valid-object-id" }, process.env.JWT_SECRET);
      
      const response = await request(app)
        .get('/test/admin')
        .set('Authorization', `Bearer ${invalidToken}`)
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Invalid user ID format");
    });
  });

  describe("Real Authentication Flow", () => {
    test("multiple requests should work with the same token", async () => {
      // First request
      await request(app)
        .get('/test/user')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      
      // Second request with same token
      await request(app)
        .get('/test/user')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      
      // Third request to admin endpoint
      await request(app)
        .get('/test/admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    test("should correctly parse JWT payload and attach to request", async () => {
      // Create a token with additional claims
      const tokenWithClaims = JWT.sign({ 
        _id: adminUserId,
        name: "Test Admin",
        email: "admin@test.com"
      }, process.env.JWT_SECRET);
      
      const response = await request(app)
        .get('/test/user')
        .set('Authorization', `Bearer ${tokenWithClaims}`)
        .expect(200);
      
      // Check that user object has all claims from token
      expect(response.body.user._id).toBe(adminUserId.toString());
      expect(response.body.user.name).toBe("Test Admin");
      expect(response.body.user.email).toBe("admin@test.com");
    });
  });
});
