import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import axios from "axios";
import CartPage from "./CartPage";
import { AuthProvider } from "../context/auth";
import { SearchProvider } from "../context/search";
import { CartProvider } from "../context/cart";

// Simulate axios GET calls
jest.mock("axios");

// Setup global matchMedia (required by Ant Design)
window.matchMedia =
  window.matchMedia ||
  function () {
    return {
      matches: false,
      addListener: () => {},
      removeListener: () => {},
    };
  };

const renderCartPage = () => {
  render(
    <AuthProvider>
      <SearchProvider>
        <CartProvider>
          <MemoryRouter initialEntries={["/cart"]}>
            <Routes>
              <Route path="/cart" element={<CartPage />} />
            </Routes>
          </MemoryRouter>
        </CartProvider>
      </SearchProvider>
    </AuthProvider>
  );
};

describe("CartPage Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Fake client token for Braintree
    axios.get.mockImplementation((url) => {
      if (url === "/api/v1/product/braintree/token") {
        return Promise.resolve({ data: { clientToken: "mock-token" } });
      }
      return Promise.resolve({ data: {} });
    });
  });

  it("renders guest message if user not logged in", async () => {
    renderCartPage();

    await waitFor(() => {
      expect(screen.getByText(/Hello\s+Guest/i)).toBeInTheDocument();
      expect(screen.getByText(/Your Cart Is Empty/i)).toBeInTheDocument();
    });
  });

  it("renders login prompt when user has items but is not logged in", async () => {
    // Save cart item to localStorage
    localStorage.setItem(
      "cart",
      JSON.stringify([
        {
          _id: "prod1",
          name: "Test Product",
          description: "Test description",
          price: 100,
        },
      ])
    );

    renderCartPage();

    await waitFor(() => {
      expect(screen.getByText("Test Product")).toBeInTheDocument();
      expect(screen.getByText("Cart Summary")).toBeInTheDocument();
      expect(screen.getByText(/Plase Login to checkout/i)).toBeInTheDocument();
    });

    // Clean up
    localStorage.removeItem("cart");
  });
});
