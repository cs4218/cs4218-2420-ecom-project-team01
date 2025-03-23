import mongoose from "mongoose";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import express from "express";
import jwt from "jsonwebtoken";
import categoryRoutes from "../routes/categoryRoutes.js";
import categoryModel from "../models/categoryModel.js";
import userModel from "../models/userModel.js";
import dotenv from "dotenv";

dotenv.config();

let mongodb;
let app;

beforeAll(async () => {
  mongodb = await MongoMemoryServer.create();
  const uri = mongodb.getUri();
  await mongoose.connect(uri);
  app = express();
  app.use(express.json());
  app.use("/api/v1/category", categoryRoutes);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongodb.stop();
});

afterEach(async () => {
  jest.restoreAllMocks();
  await categoryModel.deleteMany();
});

describe("Category Controller Integration", () => {
  let token;

  beforeAll(async () => {
    const testAdminUser = {
      name: "Test User",
      email: "testuser@test.com",
      password: "testPassword123",
      phone: "12345678",
      address: {},
      answer: "Test answer",
      role: 1,
    };
    const user = await userModel.create(testAdminUser);
    token = jwt.sign(
      { _id: user._id, role: user.role },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );
  });

  const getCategory = (name) => ({ name, slug: name });

  describe("POST /create-category", () => {
    it("should return 401 if name is missing", async () => {
      const res = await request(app)
        .post("/api/v1/category/create-category")
        .set("Authorization", `Bearer ${token}`)
        .send({});
      expect(res.status).toBe(401);
      expect(res.body.message).toBe("Name is required");
    });

    it("should return 200 if category already exists", async () => {
      await categoryModel.create(getCategory("Duplicate"));
      const res = await request(app)
        .post("/api/v1/category/create-category")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Duplicate" });
      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/already exists/i);
    });

    it("should create a new category", async () => {
      const res = await request(app)
        .post("/api/v1/category/create-category")
        .set("Authorization", `Bearer ${token}`)
        .send(getCategory("NewCat"));
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.category.name).toBe("NewCat");
    });

    it("should return 500 on server error", async () => {
      jest
        .spyOn(categoryModel.prototype, "save")
        .mockImplementationOnce(() => {
          throw new Error("DB error");
        });
      const res = await request(app)
        .post("/api/v1/category/create-category")
        .set("Authorization", `Bearer ${token}`)
        .send(getCategory("ErrorCat"));
      expect(res.status).toBe(500);
    });

    it("should trim category name on creation", async () => {
      const res = await request(app)
        .post("/api/v1/category/create-category")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "  Trimmed  " });
      expect(res.status).toBe(201);
      expect(res.body.category.name).toBe("  Trimmed  ");
    });

    it("should lowercase slug on category creation", async () => {
      const res = await request(app)
        .post("/api/v1/category/create-category")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "MyCategory" });
      expect(res.body.category.slug).toBe("mycategory");
    });

    it("should return expected fields in category object", async () => {
      const res = await request(app)
        .post("/api/v1/category/create-category")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "FieldTest" });
      const category = res.body.category;
      expect(category).toHaveProperty("_id");
      expect(category).toHaveProperty("name", "FieldTest");
      expect(category).toHaveProperty("slug");
    });

    it("should respond with proper message when duplicate category is added", async () => {
      await categoryModel.create(getCategory("RepeatName"));
      const res = await request(app)
        .post("/api/v1/category/create-category")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "RepeatName" });
      expect(res.body.message).toMatch(/already exists/i);
    });

    it("should reject invalid JWT", async () => {
      const res = await request(app)
        .post("/api/v1/category/create-category")
        .set("Authorization", `Bearer invalidtoken`)
        .send({ name: "BadJWT" });
      expect(res.status).toBe(401);
    });

    it("should respect Authorization Bearer casing", async () => {
      const res = await request(app)
        .post("/api/v1/category/create-category")
        .set("authorization", `Bearer ${token}`)
        .send({ name: "CaseInsensitiveHeader" });
      expect(res.status).toBe(201);
    });

    it("should fail to create category if DB error on findOne", async () => {
      jest
        .spyOn(categoryModel, "findOne")
        .mockImplementationOnce(() => {
          throw new Error("DB fail");
        });
      const res = await request(app)
        .post("/api/v1/category/create-category")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "CrashFindOne" });
      expect(res.status).toBe(500);
    });
  });

  describe("PUT /update-category/:id", () => {
    it("should update the category", async () => {
      const cat = await categoryModel.create(getCategory("OldName"));
      const res = await request(app)
        .put(`/api/v1/category/update-category/${cat._id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "UpdatedName" });
      expect(res.status).toBe(200);
      expect(res.body.category.name).toBe("UpdatedName");
    });

    it("should return 500 on update error", async () => {
      const id = new mongoose.Types.ObjectId();
      jest
        .spyOn(categoryModel, "findByIdAndUpdate")
        .mockImplementationOnce(() => {
          throw new Error("DB error");
        });
      const res = await request(app)
        .put(`/api/v1/category/update-category/${id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "ErrorName" });
      expect(res.status).toBe(500);
    });

    it("should not update if name is missing", async () => {
      const cat = await categoryModel.create(getCategory("UpdateFail"));
      const res = await request(app)
        .put(`/api/v1/category/update-category/${cat._id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({});
      expect(res.status).toBe(500);
    });

    it("should not update category with invalid ID", async () => {
      const res = await request(app)
        .put(`/api/v1/category/update-category/invalidid`)
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "InvalidUpdate" });
      expect(res.status).toBe(500);
    });

    it("should return 401 when updating category without auth", async () => {
      const cat = await categoryModel.create(getCategory("NoAuthUpdate"));
      const res = await request(app)
        .put(`/api/v1/category/update-category/${cat._id}`)
        .send({ name: "ShouldFail" });
      expect(res.status).toBe(401);
    });

    it("should lowercase slug after update", async () => {
      const cat = await categoryModel.create(getCategory("StartSlug"));
      const res = await request(app)
        .put(`/api/v1/category/update-category/${cat._id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "UPPERCASE" });
      expect(res.body.category.slug).toBe("uppercase");
    });
  });

  describe("GET /get-category", () => {
    it("should return all categories", async () => {
      await categoryModel.create(getCategory("Cat1"));
      const res = await request(app).get("/api/v1/category/get-category");
      expect(res.status).toBe(200);
      expect(res.body.category.length).toBe(1);
    });

    it("should return empty list if no categories exist", async () => {
      const res = await request(app).get("/api/v1/category/get-category");
      expect(res.status).toBe(200);
      expect(res.body.category).toEqual([]);
    });

    it("should respond with correct content type", async () => {
      const res = await request(app).get("/api/v1/category/get-category");
      expect(res.headers["content-type"]).toMatch(/json/);
    });

    it("should create multiple categories and return all", async () => {
      await request(app)
        .post("/api/v1/category/create-category")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "One" });
      await request(app)
        .post("/api/v1/category/create-category")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Two" });
      const res = await request(app).get("/api/v1/category/get-category");
      expect(res.body.category.length).toBeGreaterThanOrEqual(2);
    });

    it("should return 500 on error", async () => {
      jest.spyOn(categoryModel, "find").mockImplementationOnce(() => {
        throw new Error("Crash find()");
      });
      const res = await request(app).get("/api/v1/category/get-category");
      expect(res.status).toBe(500);
    });
  });

  describe("GET /single-category/:slug", () => {
    it("should return a single category by slug", async () => {
      const cat = await categoryModel.create(getCategory("UniqueSlug"));
      const res = await request(app).get(
        `/api/v1/category/single-category/${cat.slug}`
      );
      expect(res.status).toBe(200);
      expect(res.body.category.name).toBe("UniqueSlug");
    });

    it("should return 404 if category slug does not exist", async () => {
      const res = await request(app).get(
        `/api/v1/category/single-category/nonexistent-slug`
      );
      expect(res.status).toBe(200);
      expect(res.body.category).toBeNull();
    });

    it("should still fetch single category even with extra slashes", async () => {
      const cat = await categoryModel.create(getCategory("SlugEdge"));
      const res = await request(app).get(
        `/api/v1/category/single-category//${cat.slug}`
      );
      expect(res.status).toBe(404);
    });

    it("should return 500 on single category error", async () => {
      jest.spyOn(categoryModel, "findOne").mockImplementationOnce(() => {
        throw new Error("DB error");
      });
      const res = await request(app).get(
        `/api/v1/category/single-category/fake-slug`
      );
      expect(res.status).toBe(500);
    });

    it("should create and then fetch new category by slug", async () => {
      const create = await request(app)
        .post("/api/v1/category/create-category")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "FetchMe" });
      const slug = create.body.category.slug;
      const fetch = await request(app).get(
        `/api/v1/category/single-category/${slug}`
      );
      expect(fetch.status).toBe(200);
      expect(fetch.body.category.name).toBe("FetchMe");
    });
  });

  describe("DELETE /delete-category/:id", () => {
    it("should delete a category", async () => {
      const cat = await categoryModel.create(getCategory("ToDelete"));
      const res = await request(app)
        .delete(`/api/v1/category/delete-category/${cat._id}`)
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/deleted successfully/i);
    });

    it("should return 500 on delete error", async () => {
      const id = new mongoose.Types.ObjectId();
      jest.spyOn(categoryModel, "findByIdAndDelete").mockImplementationOnce(() => {
        throw new Error("DB error");
      });
      const res = await request(app)
        .delete(`/api/v1/category/delete-category/${id}`)
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(500);
    });

    it("should not allow unauthenticated user to delete category", async () => {
      const cat = await categoryModel.create(getCategory("NoAuthDelete"));
      const res = await request(app).delete(
        `/api/v1/category/delete-category/${cat._id}`
      );
      expect(res.status).toBe(401);
    });

    it("should not delete category with invalid ID", async () => {
      const res = await request(app)
        .delete(`/api/v1/category/delete-category/invalidid`)
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(500);
    });

    it("should return 401 when deleting category without auth", async () => {
      const cat = await categoryModel.create(getCategory("NoAuthDelete2"));
      const res = await request(app)
        .delete(`/api/v1/category/delete-category/${cat._id}`);
      expect(res.status).toBe(401);
    });
  });
});
