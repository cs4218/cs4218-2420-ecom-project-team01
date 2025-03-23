import React from "react";
import { render, screen, waitFor, act, within } from "@testing-library/react";
import axios from "axios";
import "@testing-library/jest-dom/extend-expect";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { SearchProvider } from "../../context/search";
import { CartProvider } from "../../context/cart";
import Orders from "./Orders";

jest.mock("axios");

// Mock auth context
jest.mock("../../context/auth", () => {
  const originalModule = jest.requireActual("../../context/auth");
  return {
    ...originalModule,
    useAuth: jest.fn(),
    AuthProvider: ({ children }) => <div>{children}</div>,
  };
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

const renderPage = (initialEntries = ["/dashboard/user/orders"], authValue = [{ token: 'fake-token' }, jest.fn()]) => {
  const { useAuth } = require("../../context/auth");
  useAuth.mockReturnValue(authValue);
  
  return render(
    <SearchProvider>
      <CartProvider>
        <MemoryRouter initialEntries={initialEntries}>
          <Routes>
            <Route path="/dashboard/user/orders" element={<Orders />} />
          </Routes>
        </MemoryRouter>
      </CartProvider>
    </SearchProvider>
  );
};

describe("Orders Page", () => {
  let mockOrders;

  beforeEach(() => {
    jest.clearAllMocks();

    mockOrders = [
      {
        _id: "order1",
        status: "Processing",
        buyer: { name: "John Doe" },
        createAt: "2023-04-01T12:00:00Z",
        payment: { success: true },
        products: [
          {
            _id: "product1",
            name: "Test Product 1",
            description: "This is a test product description",
            price: 99.99,
          },
          {
            _id: "product2",
            name: "Test Product 2",
            description: "Another test product description",
            price: 49.99,
          },
        ],
      },
      {
        _id: "order2",
        status: "Shipped",
        buyer: { name: "Jane Smith" },
        createAt: "2023-04-05T12:00:00Z",
        payment: { success: false },
        products: [
          {
            _id: "product3",
            name: "Test Product 3",
            description: "Yet another test product",
            price: 29.99,
          },
        ],
      },
    ];

    // Mock localStorage for auth token
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(() => JSON.stringify({ token: 'fake-token' })),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      },
      writable: true
    });
  });

  test("should display orders when user is authenticated", async () => {
    // Mock axios to return orders
    axios.get.mockImplementation((url) => {
      switch (url) {
        case "/api/v1/category/get-category":
          return Promise.resolve({
            data: { success: true, category: [] },
          });
        case "/api/v1/auth/orders":
          return Promise.resolve({
            data: mockOrders,
          });
        default:
          return Promise.reject(new Error("Not found"));
      }
    });

    renderPage();

    // Wait for orders to load and appear in the DOM
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/orders");
    });

    // Check if orders are displayed correctly
    await waitFor(() => {
      expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/Jane Smith/i)).toBeInTheDocument();
    expect(screen.getByText(/Processing/i)).toBeInTheDocument();
    expect(screen.getByText(/Shipped/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Success/i)[0]).toBeInTheDocument();
    expect(screen.getByText(/Failed/i)).toBeInTheDocument();

    // Check for products
    expect(screen.getByText(/Test Product 1/i)).toBeInTheDocument();
    expect(screen.getByText(/Test Product 2/i)).toBeInTheDocument();
    expect(screen.getByText(/Test Product 3/i)).toBeInTheDocument();

    // Check for product details
    const truncatedDesc = mockOrders[0].products[0].description.substring(0, 30);
    expect(screen.getByText(truncatedDesc)).toBeInTheDocument();
    expect(screen.getByText(/Price : 99.99/i)).toBeInTheDocument();
    
    // Check for images
    const images = screen.getAllByRole("img");
    expect(images.length).toBe(3);
    expect(images[0]).toHaveAttribute("src", "/api/v1/product/product-photo/product1");
    expect(images[1]).toHaveAttribute("src", "/api/v1/product/product-photo/product2");
    expect(images[2]).toHaveAttribute("src", "/api/v1/product/product-photo/product3");
  });

  test("should display message when no orders found", async () => {
    // Mock axios to return empty orders array
    axios.get.mockImplementation((url) => {
      switch (url) {
        case "/api/v1/category/get-category":
          return Promise.resolve({
            data: { success: true, category: [] },
          });
        case "/api/v1/auth/orders":
          return Promise.resolve({
            data: [],
          });
        default:
          return Promise.reject(new Error("Not found"));
      }
    });

    renderPage();

    // Wait for component to render and axios request to be made
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/orders");
    });

    // Check for no orders message
    expect(screen.getByText(/No orders found/i)).toBeInTheDocument();
  });

  test("should handle null values in order data gracefully", async () => {
    const incompleteOrder = [{
      _id: "order3",
      status: null,
      buyer: null,
      createAt: null,
      payment: null,
      products: [
        {
          _id: "product4",
          name: "Test Product 4",
          description: null,
          price: null,
        },
      ],
    }];

    // Mock axios to return incomplete order data
    axios.get.mockImplementation((url) => {
      switch (url) {
        case "/api/v1/category/get-category":
          return Promise.resolve({
            data: { success: true, category: [] },
          });
        case "/api/v1/auth/orders":
          return Promise.resolve({
            data: incompleteOrder,
          });
        default:
          return Promise.reject(new Error("Not found"));
      }
    });

    renderPage();

    // Wait for axios request to be made and response to be processed
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/orders");
    });

    // Check if fallback values are used
    await waitFor(() => {
      expect(screen.getByText(/Unknown Buyer/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/Unknown Date/i)).toBeInTheDocument();
    expect(screen.getByText(/Test Product 4/i)).toBeInTheDocument();
  });

  test("should handle API error gracefully", async () => {
    // Spy on console.error to verify it gets called
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    // Mock axios to reject
    axios.get.mockImplementation((url) => {
      switch (url) {
        case "/api/v1/category/get-category":
          return Promise.resolve({
            data: { success: true, category: [] },
          });
        case "/api/v1/auth/orders":
          return Promise.reject(new Error("API Error"));
        default:
          return Promise.reject(new Error("Not found"));
      }
    });

    renderPage();

    // Wait for component to render and API to be called
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/orders");
    });

    // Verify error was logged
    expect(consoleErrorSpy).toHaveBeenCalled();
    
    // Cleanup
    consoleErrorSpy.mockRestore();
  });

  test("should not make API call if user is not authenticated", async () => {
    // Set up with no auth token
    renderPage(
      ["/dashboard/user/orders"], 
      [{ token: null }, jest.fn()]
    );

    // Give component time to potentially make API calls
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify axios.get was not called for orders
    expect(axios.get).not.toHaveBeenCalledWith("/api/v1/auth/orders");
  });

  test("should truncate long product descriptions correctly", async () => {
    const longDescription = "This is a very long description that definitely exceeds thirty characters and should be truncated";
    const orderWithLongDesc = [{
      _id: "order4",
      status: "Delivered",
      buyer: { name: "Test User" },
      createAt: "2023-04-10T12:00:00Z",
      payment: { success: true },
      products: [
        {
          _id: "product5",
          name: "Test Product 5",
          description: longDescription,
          price: 199.99,
        },
      ],
    }];

    // Mock axios to return order with long description
    axios.get.mockImplementation((url) => {
      switch (url) {
        case "/api/v1/category/get-category":
          return Promise.resolve({
            data: { success: true, category: [] },
          });
        case "/api/v1/auth/orders":
          return Promise.resolve({
            data: orderWithLongDesc,
          });
        default:
          return Promise.reject(new Error("Not found"));
      }
    });

    renderPage();

    // Wait for axios request to be made and response to be processed
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/orders");
    });

    // Check if description is truncated correctly 
    const expectedTruncatedText = longDescription.substring(0, 30);
    await waitFor(() => {
      expect(screen.getByText(expectedTruncatedText)).toBeInTheDocument();
    });
  });
});
