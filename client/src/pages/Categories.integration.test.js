import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import axios from "axios";
import "@testing-library/jest-dom/extend-expect";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "../context/auth";
import { SearchProvider } from "../context/search";
import { CartProvider } from "../context/cart";
import Categories from "./Categories";

jest.mock("axios");

const mockCategories = [
  { _id: "1", name: "Electronics", slug: "electronics" },
  { _id: "2", name: "Books", slug: "books" },
];

describe("Categories Page Integration", () => {
  beforeEach(() => {
    axios.get.mockImplementation((url) => {
      if (url === "/api/v1/category/get-category") {
        return Promise.resolve({
          data: { success: true, category: mockCategories },
        });
      }
      return Promise.resolve({ data: {} });
    });
  });

  test("should render fetched categories as links in the category section only", async () => {
    render(
      <AuthProvider>
        <SearchProvider>
          <CartProvider>
            <MemoryRouter initialEntries={["/categories"]}>
              <Routes>
                <Route path="/categories" element={<Categories />} />
              </Routes>
            </MemoryRouter>
          </CartProvider>
        </SearchProvider>
      </AuthProvider>
    );

    const categorySection = await screen.findByTestId("category-list");

    for (const category of mockCategories) {
      const link = await within(categorySection).findByRole("link", {
        name: category.name,
      });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", `/category/${category.slug}`);
    }
  });

  test("should render no category links if category list is empty", async () => {
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: [] },
    });

    render(
      <AuthProvider>
        <SearchProvider>
          <CartProvider>
            <MemoryRouter initialEntries={["/categories"]}>
              <Routes>
                <Route path="/categories" element={<Categories />} />
              </Routes>
            </MemoryRouter>
          </CartProvider>
        </SearchProvider>
      </AuthProvider>
    );

    const categorySection = await screen.findByTestId("category-list");

    await waitFor(() => {
      const links = within(categorySection).queryAllByRole("link");
      expect(links).toHaveLength(0);
    });
  });
});
