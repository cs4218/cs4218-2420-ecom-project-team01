import { hashPassword, comparePassword } from "./authHelper.js";
import userModel from "../models/userModel.js";
import connectDB from "../config/db.js"; 
import mongoose from "mongoose";

describe("Auth Helper Integration Tests", () => {
  // Test data
  const validPasswords = [
    { type: "common string", value: "password123" },
    { type: "complex string", value: "P@ssw0rd!123" },
    { type: "numeric string", value: "12345" },
    { type: "number", value: 12345 },
    { type: "special chars", value: "!@#$%^&*()" },
  ];

  const invalidPasswords = [
    { type: "null", value: null },
    { type: "undefined", value: undefined },
    { type: "object", value: { password: "secret" } },
    { type: "array", value: ["password"] },
    { type: "empty string", value: "" },
    { type: "boolean", value: true },
  ];

  // Logging setup for debugging
  let originalConsoleError;
  
  beforeAll(async () => {
    process.env.NODE_ENV = "test"; 
    await connectDB();
    
    originalConsoleError = console.error;
    console.error = jest.fn();
  });

  afterAll(async () => {
    // Clean up database and ensure proper disconnect
    try {
      await mongoose.connection.dropDatabase();
      await mongoose.disconnect();
    } catch (error) {
      console.error("Error during test cleanup:", error);
    }
    
    // Restore original console.error
    console.error = originalConsoleError;
  });

  beforeEach(async () => {
    // Clear test collections before each test
    await userModel.deleteMany({});
    
    // Clear mock between tests
    jest.clearAllMocks();
  });

  // Helper function for creating valid user objects
  const createValidUserData = (customData = {}) => {
    return {
      username: "testuser",
      email: "test@example.com",
      password: "test-password",
      name: "Test User",
      phone: "1234567890",
      address: "123 Test Street, Test City",
      answer: "Test answer for security question",
      ...customData
    };
  };

  describe("End-to-End User Authentication Flow", () => {
    test("should register a user with hashed password and allow successful login", async () => {
      // Given a new user with all required fields
      const userData = createValidUserData({
        username: "testuser",
        email: "test@example.com",
        password: "integration-test-password"
      });
      
      // When registering the user (simulating registration endpoint)
      const hashedPassword = await hashPassword(userData.password);
      const newUser = new userModel({
        ...userData,
        password: hashedPassword
      });
      await newUser.save();
      
      // Then the user should be saved with a hashed password
      const savedUser = await userModel.findOne({ email: userData.email });
      expect(savedUser).not.toBeNull();
      expect(savedUser.password).not.toBe(userData.password);
      
      // And when attempting to login (simulating login endpoint)
      const passwordMatches = await comparePassword(
        userData.password, 
        savedUser.password
      );
      
      // Then authentication should succeed
      expect(passwordMatches).toBe(true);
    });

    test("should reject login with incorrect password", async () => {
      // Given a registered user with all required fields
      const userData = createValidUserData({
        username: "existinguser", 
        email: "existing@example.com"
      });
      
      userData.password = await hashPassword("correct-password");
      
      const user = new userModel(userData);
      await user.save();
      
      // When attempting to login with wrong password
      const incorrectPassword = "wrong-password";
      const passwordMatches = await comparePassword(
        incorrectPassword,
        userData.password
      );
      
      // Then authentication should fail
      expect(passwordMatches).toBe(false);
    });
  });

  describe("Password Security Integration Tests", () => {
    test("should protect against database breach by securing stored passwords", async () => {
      // Given a set of users with various password types
      const users = await Promise.all(validPasswords.map(async (pass, index) => {
        const userData = createValidUserData({
          username: `securitytest${index}`,
          email: `security${index}@test.com`,
          password: await hashPassword(pass.value)
        });
        
        const user = new userModel(userData);
        return user.save();
      }));
      
      // When simulating a database breach (direct DB query)
      const storedUsers = await userModel.find({});
      
      // Then all passwords should be properly hashed
      for (const user of storedUsers) {
        expect(user.password).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt pattern
        // Ensure original passwords cannot be derived from stored hash
        const originalPassword = validPasswords[storedUsers.indexOf(user)].value;
        expect(user.password).not.toBe(originalPassword);
        expect(user.password).not.toBe(originalPassword.toString());
      }
    });
  });

  describe("Password Hashing with Real Bcrypt", () => {
    test.each(validPasswords)(
      "should hash $type password",
      async ({ value }) => {
        // When
        const hashedPassword = await hashPassword(value);

        // Then
        expect(typeof hashedPassword).toBe("string");
        expect(hashedPassword).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt hash pattern
        expect(hashedPassword.length).toBeGreaterThan(50); // bcrypt hashes are long
      }
    );

    test.each(invalidPasswords)(
      "should reject $type as password",
      async ({ value }) => {
        // When/Then
        await expect(hashPassword(value)).rejects.toThrow();
      }
    );

    test("should generate different hashes for the same password due to salt", async () => {
      // Given
      const password = "same-password";

      // When
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      // Then
      expect(hash1).not.toBe(hash2);
    });
  });

  describe("Password Comparison with Real Bcrypt", () => {
    test.each(validPasswords)(
      "should verify $type password after hashing",
      async ({ value }) => {
        // Given
        const hashedPassword = await hashPassword(value);

        // When
        const result = await comparePassword(value, hashedPassword);

        // Then
        expect(result).toBe(true);
      }
    );

    test.each(invalidPasswords)(
      "should reject $type during comparison",
      async ({ value }) => {
        // Given
        const validHash = await hashPassword("valid-password");

        // When/Then
        await expect(comparePassword(value, validHash)).rejects.toThrow();
      }
    );
  });

  describe("Performance in Real-World Usage", () => {
    test("should handle concurrent user registrations efficiently", async () => {
      // Given multiple concurrent user registration requests
      const startTime = Date.now();
      const userCount = 5;
      const userPromises = [];
      
      for (let i = 0; i < userCount; i++) {
        userPromises.push((async () => {
          const hashedPassword = await hashPassword(`concurrent-test-${i}`);
          const userData = createValidUserData({
            username: `concurrent${i}`,
            email: `concurrent${i}@test.com`,
            password: hashedPassword
          });
          
          const user = new userModel(userData);
          return user.save();
        })());
      }
      
      // When registering all users concurrently
      await Promise.all(userPromises);
      const duration = Date.now() - startTime;
      
      // Then the operation should complete within reasonable time
      const avgTimePerUser = duration / userCount;
      console.log(`Average user registration time: ${avgTimePerUser}ms`);
      expect(avgTimePerUser).toBeLessThan(500); // Adjust based on your performance needs
      
      // And all users should be properly saved
      const savedUsers = await userModel.countDocuments();
      expect(savedUsers).toBe(userCount);
    });
  });

  describe("Error Handling and System Integration", () => {    
    test("should maintain database integrity during failed operations", async () => {
      // Given a valid user and an invalid user data
      const validUser = createValidUserData({
        username: "validuser",
        email: "valid@example.com",
        password: await hashPassword("valid-password")
      });
      
      const invalidPassword = { password: "invalid-object" };
      
      // When saving the valid user
      await new userModel(validUser).save();
      
      // And attempting to save an invalid user in the same batch
      try {
        await hashPassword(invalidPassword);
        const invalidUserData = createValidUserData({
          username: "invaliduser",
          email: "invalid@example.com",
          password: "will-never-reach-here"
        });
        await new userModel(invalidUserData).save();
      } catch (error) {
        // Expected to throw
      }
      
      // Then the database should maintain integrity
      const userCount = await userModel.countDocuments();
      expect(userCount).toBe(1); // Only the valid user should be saved
    });
  });
});
