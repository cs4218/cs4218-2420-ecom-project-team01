import { 
    createCategoryController, 
    updateCategoryController, 
    categoryControlller, 
    singleCategoryController, 
    deleteCategoryCOntroller 
  } from "../controllers/categoryController.js";
  import categoryModel from "../models/categoryModel.js";
  import slugify from "slugify";
  
  // Mock categoryModel so that we don't hit the real database
  jest.mock("../models/categoryModel.js");
  
  describe("Category Controllers", () => {
    let req, res;
    
    beforeEach(() => {
      // Reset req and res for each test
      req = {};
      res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };
      jest.clearAllMocks();
    });
  
    describe("createCategoryController", () => {
      it("should return 401 if name is missing", async () => {
        req.body = {};
        
        await createCategoryController(req, res);
        
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.send).toHaveBeenCalledWith({ message: "Name is required" });
      });
  
      it("should return a message if category already exists", async () => {
        req.body = { name: "Test Category" };
        categoryModel.findOne.mockResolvedValueOnce({ name: "Test Category" });
  
        await createCategoryController(req, res);
  
        expect(categoryModel.findOne).toHaveBeenCalledWith({ name: "Test Category" });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith({
          success: true,
          message: "Category Already Exisits",
        });
      });
  
      it("should create a new category successfully", async () => {
        req.body = { name: "New Category" };
        categoryModel.findOne.mockResolvedValueOnce(null);
        
        // When a new category is created, the controller does:
        // new categoryModel({ name, slug: slugify(name) }).save()
        // We simulate this by making categoryModel a constructor that returns an object with a save() method.
        const savedCategory = {
          _id: "1",
          name: "New Category",
          slug: slugify("New Category"),
        };
        categoryModel.mockImplementation(() => ({
          save: jest.fn().mockResolvedValue(savedCategory),
        }));
  
        await createCategoryController(req, res);
  
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.send).toHaveBeenCalledWith({
          success: true,
          message: "new category created",
          category: savedCategory,
        });
      });
    });
  
    describe("updateCategoryController", () => {
      it("should update a category successfully", async () => {
        req.body = { name: "Updated Category" };
        req.params = { id: "1" };
  
        const updatedCategory = {
          _id: "1",
          name: "Updated Category",
          slug: slugify("Updated Category"),
        };
        categoryModel.findByIdAndUpdate.mockResolvedValue(updatedCategory);
  
        await updateCategoryController(req, res);
  
        expect(categoryModel.findByIdAndUpdate).toHaveBeenCalledWith(
          "1",
          { name: "Updated Category", slug: slugify("Updated Category") },
          { new: true }
        );
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith({
          success: true,
          messsage: "Category Updated Successfully",
          category: updatedCategory,
        });
      });
    });
  
    describe("categoryControlller (get all categories)", () => {
      it("should fetch all categories", async () => {
        const categories = [
          { _id: "1", name: "Cat1" },
          { _id: "2", name: "Cat2" },
        ];
        categoryModel.find.mockResolvedValue(categories);
  
        await categoryControlller(req, res);
  
        expect(categoryModel.find).toHaveBeenCalledWith({});
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith({
          success: true,
          message: "All Categories List",
          category: categories,
        });
      });
    });
  
    describe("singleCategoryController", () => {
      it("should fetch a single category by slug", async () => {
        req.params = { slug: "test-category" };
        const category = { _id: "1", name: "Test Category", slug: "test-category" };
        categoryModel.findOne.mockResolvedValue(category);
  
        await singleCategoryController(req, res);
  
        expect(categoryModel.findOne).toHaveBeenCalledWith({ slug: "test-category" });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith({
          success: true,
          message: "Get SIngle Category SUccessfully",
          category: category,
        });
      });
    });
  
    describe("deleteCategoryCOntroller", () => {
      it("should delete a category successfully", async () => {
        req.params = { id: "1" };
        categoryModel.findByIdAndDelete.mockResolvedValue();
  
        await deleteCategoryCOntroller(req, res);
  
        expect(categoryModel.findByIdAndDelete).toHaveBeenCalledWith("1");
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith({
          success: true,
          message: "Categry Deleted Successfully",
        });
      });
    });
  });
  