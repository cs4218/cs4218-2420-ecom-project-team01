import {
    createCategoryController,
    updateCategoryController,
    categoryController,
    singleCategoryController,
    deleteCategoryCOntroller,
  } from "../controllers/categoryController.js";
  import categoryModel from "../models/categoryModel.js";
  import slugify from "slugify";
  
  jest.mock("../models/categoryModel.js");
  
  describe("Category Controllers", () => {
    let req, res;
    
    beforeEach(() => {
      req = { body: {}, params: {} };
      res = {
        status: jest.fn(() => res),
        send: jest.fn(),
      };
      jest.clearAllMocks();
    });
    
    
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
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Category Already Exists",
      });
    });
    
    it("should create a new category successfully", async () => {
      req.body = { name: "New Category" };
      categoryModel.findOne.mockResolvedValueOnce(null);
      
      const savedCategory = {
        _id: "1",
        name: "New Category",
        slug: slugify("New Category"),
      };
      categoryModel.mockImplementation(() => ({
        save: jest.fn().mockResolvedValue(savedCategory),
      }));
      
      await createCategoryController(req, res);
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "new category created",
        category: savedCategory,
      });
    });
    
    it("should return 500 status and message when an error occurs in createCategoryController", async () => {
      req.body = { name: "Test Category" };
      const testError = new Error("Test error");
      categoryModel.findOne.mockRejectedValueOnce(testError);
      
      await createCategoryController(req, res);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        error: testError,
        message: "Error in Category",
      });
    });
    
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
    
    it("should handle errors in updateCategoryController", async () => {
      req.body = { name: "UpdatedCategory" };
      req.params = { id: "143" };
      const testError = new Error("Update error");
      categoryModel.findByIdAndUpdate.mockRejectedValueOnce(testError);
      
      await updateCategoryController(req, res);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        error: testError,
        message: "Error while updating category",
      });
    });
    
    
    it("should fetch all categories", async () => {
      const categories = [
        { _id: "1", name: "Cat1" },
        { _id: "2", name: "Cat2" },
      ];
      categoryModel.find.mockResolvedValue(categories);
      
      await categoryController(req, res);
      
      expect(categoryModel.find).toHaveBeenCalledWith({});
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "All Categories List",
        category: categories,
      });
    });
    
    it("should handle errors in categoryController", async () => {
      const testError = new Error("Get error");
      categoryModel.find.mockRejectedValueOnce(testError);
      
      await categoryController(req, res);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        error: testError,
        message: "Error while getting all categories",
      });
    });
    
    
    it("should fetch a single category by slug", async () => {
      req.params = { slug: "test-category" };
      const category = { _id: "1", name: "Test Category", slug: "test-category" };
      categoryModel.findOne.mockResolvedValue(category);
      
      await singleCategoryController(req, res);
      
      expect(categoryModel.findOne).toHaveBeenCalledWith({ slug: "test-category" });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "Get Single Category Successfully",
        category: category,
      });
    });
    
    it("should handle errors in singleCategoryController", async () => {
      req.params = { slug: "test-slug" };
      const testError = new Error("Single get error");
      categoryModel.findOne.mockRejectedValueOnce(testError);
      
      await singleCategoryController(req, res);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        error: testError,
        message: "Error While getting Single Category",
      });
    });
    
    
    it("should delete a category successfully", async () => {
      req.params = { id: "1" };
      categoryModel.findByIdAndDelete.mockResolvedValue();
      
      await deleteCategoryCOntroller(req, res);
      
      expect(categoryModel.findByIdAndDelete).toHaveBeenCalledWith("1");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "Category Deleted Successfully",
      });
    });
    
    it("should handle errors in deleteCategoryCOntroller", async () => {
      req.params = { id: "456" };
      const testError = new Error("Delete error");
      categoryModel.findByIdAndDelete.mockRejectedValueOnce(testError);
      
      await deleteCategoryCOntroller(req, res);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error while deleting category",
        error: testError,
      });
    });
  });
  