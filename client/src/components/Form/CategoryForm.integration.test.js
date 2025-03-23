import React from "react";
import {
  render,
  screen,
  waitFor,
  act,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import CreateCategory from "../../pages/admin/CreateCategory";
import { AuthProvider } from "../../context/auth";
import { SearchProvider } from "../../context/search";
import { CartProvider } from "../../context/cart";

jest.mock("axios");
jest.spyOn(toast, "success");
jest.spyOn(toast, "error");

window.matchMedia =
  window.matchMedia ||
  function () {
    return {
      matches: false,
      addListener: function () {},
      removeListener: function () {},
    };
  };

describe("CategoryForm Integration", () => {
  const mockCategories = [
    { _id: "categoryId_1", name: "Book" },
    { _id: "categoryId_2", name: "Food" },
    { _id: "categoryId_3", name: "Electronics" },
  ];

  const renderPage = () => {
    render(
      <AuthProvider>
        <SearchProvider>
          <CartProvider>
            <MemoryRouter initialEntries={["/dashboard/admin/create-category"]}>
              <Routes>
                <Route
                  path="/dashboard/admin/create-category"
                  element={<CreateCategory />}
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
    axios.get.mockResolvedValue({
      data: { success: true, category: mockCategories },
    });
  });

  test("should submit new category and refresh list with success toast", async () => {
    axios.post.mockResolvedValue({
      data: { success: true },
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getAllByText("Book")[0]).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText(/enter new category/i);
    const button = screen.getByRole("button", { name: /submit/i });

    await act(async () => {
      await userEvent.clear(input);
      await userEvent.type(input, "New Category");
      await userEvent.click(button);
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("New Category is created");
    });

    expect(axios.post).toHaveBeenCalledWith(
      "/api/v1/category/create-category",
      { name: "New Category" }
    );

    // URL should not change
    expect(screen.getByText('Manage Category')).toBeInTheDocument();

    const table = screen.getByTestId("category-table");
    expect(within(table).getByText("Book")).toBeInTheDocument();
    expect(within(table).getByText("Food")).toBeInTheDocument();
    expect(within(table).getByText("Electronics")).toBeInTheDocument();
  });
});
``
