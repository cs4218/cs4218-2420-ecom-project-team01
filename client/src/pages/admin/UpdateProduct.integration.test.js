import React from "react";
import { render, screen, within, waitFor, act } from "@testing-library/react";
import axios from "axios";
import "@testing-library/jest-dom/extend-expect";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import toast from "react-hot-toast";
import userEvent from "@testing-library/user-event";
import { AuthProvider } from "../../context/auth";
import { SearchProvider } from "../../context/search";
import { CartProvider } from "../../context/cart";
import Products from "./Products";
import UpdateProduct from "./UpdateProduct";

jest.mock("axios");
jest.spyOn(toast, "success");
jest.spyOn(toast, "error");

const TEST_SLUG = "test-slug";

// Need to mock, or else will have error
jest.mock("antd", () => {
  const MockSelect = ({
    placeholder,
    children,
    onChange,
    "data-testid": dataTestId,
  }) => (
    <select
      data-testid={dataTestId}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}>
      {children}
    </select>
  );
  MockSelect.Option = ({ value, children }) => (
    <option value={value}>{children}</option>
  );

  // Badge is causing render error for some reason too
  MockBadge = ({ children }) => <>{children}</>;
  return { Select: MockSelect, Badge: MockBadge };
});

window.matchMedia =
  window.matchMedia ||
  function () {
    return {
      matches: false,
      addListener: function () {},
      removeListener: function () {},
    };
  };

describe("Update Product Component", () => {
  let mockCategories, mockProduct, inputValues, waitForEffect;

  const renderPage = () => {
    render(
      <AuthProvider>
        <SearchProvider>
          <CartProvider>
            <MemoryRouter
              initialEntries={[`/dashboard/admin/product/${TEST_SLUG}`]}>
              <Routes>
                <Route
                  path="/dashboard/admin/product/:slug"
                  element={<UpdateProduct />}
                />
                <Route
                  path="/dashboard/admin/products"
                  element={<Products />}
                />
              </Routes>
            </MemoryRouter>
          </CartProvider>
        </SearchProvider>
      </AuthProvider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockCategories = [
      { _id: "categoryId_1", name: "Book" },
      { _id: "categoryId_2", name: "Food" },
      { _id: "categoryId_3", name: "Electronics" },
    ];
    mockProduct = {
      _id: "productId",
      name: "Cool product",
      description: "This product is quite cool",
      price: "7.99",
      quantity: "3",
      category: mockCategories[0]._id,
      shipping: true,
      photo: new File(["mock content"], "mockFile.jpg", {
        type: "image/jpg",
      }),
    };
    inputValues = {
      name: "Cool product",
      description: "This product is quite cool",
      price: "8.99",
      quantity: "5",
      category: mockCategories[1]._id,
      shipping: false,
      photo: new File(["another mock content"], "anotherMockFile.jpg", {
        type: "image/jpg",
      }),
    };
    axios.get.mockImplementation((url) => {
      switch (url) {
        case "/api/v1/category/get-category":
          return Promise.resolve({
            data: { success: true, category: mockCategories },
          });
        case "/api/v1/product/get-product":
          return Promise.resolve({
            data: { products: [] },
          });
        case `/api/v1/product/get-product/${TEST_SLUG}`:
          return Promise.resolve({
            data: { success: true, product: mockProduct },
          });
      }
    });

    waitForEffect = async () =>
      await waitFor(() =>
        expect(
          within(screen.getByTestId("select-category")).getByText(
            mockCategories[0].name
          )
        ).toBeInTheDocument()
      );
  });

  test("should fetch and display categories in select menu", async () => {
    renderPage();
    await waitForEffect();
    const selectElem = screen.getByTestId("select-category");

    mockCategories.forEach((category) => {
      expect(within(selectElem).getByText(category.name)).toBeInTheDocument();
    });
  });

  test("should submit form successfully and navigate to products list", async () => {
    global.URL.createObjectURL = jest.fn();
    axios.put.mockResolvedValue({ data: { success: true } });

    renderPage();
    await waitForEffect();
    await act(async () => {
      const nameField = screen.getByPlaceholderText(/write a name/i);
      userEvent.clear(nameField);
      userEvent.type(nameField, inputValues.name);

      const descriptionField =
        screen.getByPlaceholderText(/write a description/i);
      userEvent.clear(descriptionField);
      userEvent.type(descriptionField, inputValues.description);

      const priceField = screen.getByPlaceholderText(/write a price/i);
      userEvent.clear(priceField);
      userEvent.type(priceField, inputValues.price);

      const quantityField = screen.getByPlaceholderText(/write a quantity/i);
      userEvent.clear(quantityField);
      userEvent.type(quantityField, inputValues.quantity);

      userEvent.selectOptions(
        screen.getByTestId("select-category"),
        inputValues.category
      );

      userEvent.selectOptions(
        screen.getByTestId("select-shipping"),
        inputValues.shipping ? "1" : "0"
      );

      const photoInput = screen.getByTestId("photo-input");
      userEvent.upload(photoInput, inputValues.photo);
    });

    userEvent.click(
      screen.getByRole("button", {
        name: /update product/i,
      })
    );

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        "Product Updated Successfully"
      );
      expect(screen.getByText(/all products list/i)).toBeInTheDocument();
    });
  });

  test("should delete product successfully and navigate to products list", async () => {
    window.prompt = jest.fn().mockReturnValue("answer");
    axios.delete.mockResolvedValueOnce({ data: { success: true } });

    renderPage();
    await waitForEffect();
    userEvent.click(
      screen.getByRole("button", {
        name: /delete product/i,
      })
    );

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        "Product Deleted Successfully"
      );
      expect(screen.getByText(/all products list/i)).toBeInTheDocument();
    });
  });
});
