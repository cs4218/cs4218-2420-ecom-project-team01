import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import axios from "axios";
import "@testing-library/jest-dom/extend-expect";
import Products from "./Products";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "../../context/auth";
import { SearchProvider } from "../../context/search";
import { CartProvider } from "../../context/cart";
import UpdateProduct from "./UpdateProduct";
import userEvent from "@testing-library/user-event";

jest.mock("axios");
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
const renderPage = () => {
  render(
    <AuthProvider>
      <SearchProvider>
        <CartProvider>
          <MemoryRouter initialEntries={["/dashboard/admin/products"]}>
            <Routes>
              <Route
                path="/dashboard/admin/product/:slug"
                element={<UpdateProduct />}
              />
              <Route path="/dashboard/admin/products" element={<Products />} />
            </Routes>
          </MemoryRouter>
        </CartProvider>
      </SearchProvider>
    </AuthProvider>
  );
};

describe("Products Test", () => {
  const mockProducts = [
    {
      _id: "productId_1",
      name: "Nice book",
      description: "A nice book description",
      price: "$77.99",
      slug: "product-slug-1",
      category: {
        _id: "categoryId_1",
        name: "book",
      },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    axios.get.mockResolvedValue({
      data: { products: mockProducts },
    });
  });

  test("clicking on a product navigates user to product's product update page", async () => {
    renderPage();
    const productLink = await screen.findByTestId(
      `product-link-${mockProducts[0]._id}`
    );
    await act(async () => {
      userEvent.click(productLink);
    });

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /update product/i })
      ).toBeInTheDocument();
    });
  });
});
