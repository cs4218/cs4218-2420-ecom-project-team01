import userModel from "../models/userModel";
import categoryModel from "../models/categoryModel";
import productModel from "../models/productModel";
import { hashPassword } from "../helpers/authHelper";
import fs from "fs";
import path from "path";

export const populateData = async () => {
  try {
    // ================== Populate users ==================
    console.log("⏳ Populating users");

    const pathToUserData = path.resolve(__dirname, "seedData/users.json");
    const testUsers = JSON.parse(fs.readFileSync(pathToUserData, "utf8"));

    const usersWithHashedPasswords = await Promise.all(
      testUsers.map(async (user) => ({
        ...user,
        password: await hashPassword(user.password),
      }))
    );

    // Insert users into the database
    await userModel.insertMany(usersWithHashedPasswords);

    console.log("✅ Populated users");

    // ================== Populate categories ==================
    console.log("⏳ Populating categories");

    const pathToCategoryData = path.resolve(
      __dirname,
      "seedData/categories.json"
    );
    const testCategories = JSON.parse(
      fs.readFileSync(pathToCategoryData, "utf8")
    );

    const categories = await categoryModel.insertMany(testCategories);

    // Map category names to their ObjectId references
    const categoryMap = categories.reduce((map, category) => {
      map[category.name] = category._id;
      return map;
    }, {});

    console.log("✅ Populated categories");

    // ================== Populate products ==================
    console.log("⏳ Populating products");

    const pathToProductData = path.resolve(__dirname, "seedData/products.json");
    const testProducts = JSON.parse(fs.readFileSync(pathToProductData, "utf8"));

    const products = testProducts.map((product) => ({
      ...product,
      category: categoryMap[product.category],
      photo: {
        data: Buffer.from(
          imageToBase64(
            path.resolve(__dirname, "seedData/photos", product.photo)
          ),
          "base64"
        ),
        contentType: "image/jpg",
      },
    }));
    await productModel.insertMany(products);

    console.log("✅ Populated products");

    console.log("🎉🎉🎉 Test database has been populated ");
  } catch (err) {
    console.log(err);
  }
};

// Convert image file to Base64 string
const imageToBase64 = (imagePath) => {
  const image = fs.readFileSync(imagePath);
  return image.toString("base64");
};
