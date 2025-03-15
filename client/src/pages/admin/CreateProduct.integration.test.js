import React from "react";
import { render, screen, act, within, waitFor } from "@testing-library/react";
import axios from "axios";
import "@testing-library/jest-dom/extend-expect";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import toast from "react-hot-toast";
import CreateProduct from "./CreateProduct";
import userEvent from "@testing-library/user-event";
import { AuthProvider } from "../../context/auth";
import { SearchProvider } from "../../context/search";
import { CartProvider } from "../../context/cart";
import Products from "./Products";

jest.mock("axios");
jest.spyOn(toast, "success");
jest.spyOn(toast, "error");

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

describe("Create Product Component", () => {
  let mockCategories, inputValues, waitForEffect;

  const renderPage = () => {
    render(
      <AuthProvider>
        <SearchProvider>
          <CartProvider>
            <MemoryRouter initialEntries={["/dashboard/admin/create-product"]}>
              <Routes>
                <Route
                  path="/dashboard/admin/create-product"
                  element={<CreateProduct />}
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
    inputValues = {
      name: "Cool product",
      description: "This product is quite cool",
      price: "0",
      quantity: "0",
      category: mockCategories[0]._id,
      shipping: "0",
      photo: new File(["mock content"], "mockFile.jpg", {
        type: "image/jpg",
      }),
    };
    axios.get.mockImplementation((url) => {
      switch (url) {
        case "/api/v1/category/get-category":
          return Promise.resolve({
            data: { success: true, category: mockCategories },
          });
        case `/api/v1/product/get-product`:
          return Promise.resolve({
            data: { products: [] },
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
    axios.post.mockResolvedValue({ data: { success: true } });

    const formData = new FormData();
    for (const [field, value] of Object.entries(inputValues)) {
      formData.append(field, value);
    }

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

      const categorySelect = screen.getByTestId("select-category");
      userEvent.selectOptions(categorySelect, inputValues.category);

      const shippingSelect = screen.getByTestId("select-shipping");
      userEvent.selectOptions(shippingSelect, inputValues.shipping);

      const photoInput = screen.getByLabelText(/upload photo/i);
      userEvent.upload(photoInput, inputValues.photo);
    });
    userEvent.click(
      screen.getByRole("button", {
        name: /create product/i,
      })
    );

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        "Product Created Successfully"
      );
      expect(screen.getByText(/all products list/i)).toBeInTheDocument();
    });
  });
});
