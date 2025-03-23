import { hashPassword, comparePassword } from "./authHelper";
import bcrypt from "bcrypt";

// Mock bcrypt module
jest.mock("bcrypt");

describe("Auth Helper Functions", () => {
  const testPassword = "testPassword123";
  const numericPassword = 12345;
  const testHashedPassword = "hashedPassword123";

  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn();
  });

  describe("hashPassword", () => {
    test("should successfully hash a string password", async () => {
      bcrypt.hash.mockResolvedValue(testHashedPassword);

      const result = await hashPassword(testPassword);

      expect(result).toBe(testHashedPassword);
      expect(bcrypt.hash).toHaveBeenCalledWith(testPassword, 10);
      expect(bcrypt.hash).toHaveBeenCalledTimes(1);
    });

    test("should convert number to string before hashing", async () => {
      bcrypt.hash.mockResolvedValue(testHashedPassword);

      const result = await hashPassword(numericPassword);

      expect(result).toBe(testHashedPassword);
      expect(bcrypt.hash).toHaveBeenCalledWith(String(numericPassword), 10);
    });

    test("should reject object as password", async () => {
      const objectPassword = { key: "value" };
      
      await expect(hashPassword(objectPassword)).rejects.toThrow("Password must be a string or number");
      expect(bcrypt.hash).not.toHaveBeenCalled();
    });

    test("should reject array as password", async () => {
      const arrayPassword = ["password"];
      
      await expect(hashPassword(arrayPassword)).rejects.toThrow("Password must be a string or number");
      expect(bcrypt.hash).not.toHaveBeenCalled();
    });

    test("should reject boolean as password", async () => {
      await expect(hashPassword(true)).rejects.toThrow("Password must be a string or number");
      expect(bcrypt.hash).not.toHaveBeenCalled();
    });

    test("should reject null password", async () => {
      await expect(hashPassword(null)).rejects.toThrow("");
      expect(bcrypt.hash).not.toHaveBeenCalled();
    });

    test("should reject undefined password", async () => {
      await expect(hashPassword(undefined)).rejects.toThrow("");
      expect(bcrypt.hash).not.toHaveBeenCalled();
    });

    test("should reject empty string as password", async () => {
      await expect(hashPassword("")).rejects.toThrow("Password cannot be null, undefined, or an empty string");
      expect(bcrypt.hash).not.toHaveBeenCalled();
    });

    test("should throw error during hashing", async () => {
      const testError = new Error("Hashing failed");
      bcrypt.hash.mockRejectedValue(testError);

      await expect(hashPassword(testPassword)).rejects.toThrow("Password hashing failed");
      expect(console.error).toHaveBeenCalledWith("Error hashing password:", testError.message);
    });
  });

  describe("comparePassword", () => {
    test("should return true for matching passwords", async () => {
      bcrypt.compare.mockResolvedValue(true);

      const result = await comparePassword(testPassword, testHashedPassword);

      expect(result).toBe(true);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        testPassword,
        testHashedPassword
      );
    });

    test("should return false for non-matching passwords", async () => {
      bcrypt.compare.mockResolvedValue(false);

      const result = await comparePassword(testPassword, testHashedPassword);

      expect(result).toBe(false);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        testPassword,
        testHashedPassword
      );
    });

    test("should convert number to string before comparison", async () => {
      bcrypt.compare.mockResolvedValue(true);

      const result = await comparePassword(numericPassword, testHashedPassword);

      expect(result).toBe(true);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        String(numericPassword),
        testHashedPassword
      );
    });

    test("should reject object as password", async () => {
      const objectPassword = { key: "value" };
      
      await expect(comparePassword(objectPassword, testHashedPassword)).rejects.toThrow("Password must be a string or number");
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    test("should reject array as password", async () => {
      const arrayPassword = ["password"];
      
      await expect(comparePassword(arrayPassword, testHashedPassword)).rejects.toThrow("Password must be a string or number");
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    test("should reject boolean as password", async () => {
      await expect(comparePassword(true, testHashedPassword)).rejects.toThrow("Password must be a string or number");
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    test("should reject null password", async () => {
      await expect(comparePassword(null, testHashedPassword)).rejects.toThrow("Password cannot be null, undefined, or an empty string");
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    test("should reject undefined password", async () => {
      await expect(comparePassword(undefined, testHashedPassword)).rejects.toThrow("Password cannot be null, undefined, or an empty string");
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    test("should reject empty string as password", async () => {
      await expect(comparePassword("", testHashedPassword)).rejects.toThrow("Password cannot be null, undefined, or an empty string");
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    test("should reject invalid hashed password", async () => {
      await expect(comparePassword(testPassword, null)).rejects.toThrow("Invalid hashed password provided for comparison");
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    test("should reject non-string hashed password", async () => {
      await expect(comparePassword(testPassword, 12345)).rejects.toThrow("Invalid hashed password provided for comparison");
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    test("should throw error when compare fails", async () => {
      const testError = new Error("Compare failed");
      bcrypt.compare.mockRejectedValue(testError);

      await expect(comparePassword(testPassword, testHashedPassword)).rejects.toThrow("Password comparison failed");
      expect(console.error).toHaveBeenCalledWith("Error comparing passwords:", testError.message);
    });
  });
});
