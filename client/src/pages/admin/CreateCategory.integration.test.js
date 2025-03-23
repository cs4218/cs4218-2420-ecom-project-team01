import React from "react";
import { render, screen, waitFor, act, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import toast from "react-hot-toast";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";

import { AuthProvider } from "../../context/auth";
import { SearchProvider } from "../../context/search";
import { CartProvider } from "../../context/cart";

import CreateCategory from "./CreateCategory";

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

describe("CreateCategory Page", () => {
  let mockCategories, waitForEffect;

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

    mockCategories = [
      { _id: "categoryId_1", name: "Book" },
      { _id: "categoryId_2", name: "Food" },
      { _id: "categoryId_3", name: "Electronics" },
    ];

    axios.get.mockImplementation((url) => {
      if (url === "/api/v1/category/get-category") {
        return Promise.resolve({
          data: { success: true, category: mockCategories },
        });
      }
    });

    waitForEffect = async () =>
      await waitFor(() =>
        expect(screen.getAllByText(mockCategories[0].name)[0]).toBeInTheDocument()
      );
  });

  test("should fetch and display category list", async () => {
    renderPage();
    await waitForEffect();
    const table = screen.getByTestId("category-table");
    mockCategories.forEach((category) => {
      expect(within(table).getByText(category.name)).toBeInTheDocument();
    });
  });

  test("should submit new category and refresh list with success toast", async () => {
    axios.post.mockResolvedValue({ data: { success: true } });
    const newCategory = "New Cool Category";

    axios.get.mockResolvedValueOnce({
      data: {
        success: true,
        category: [...mockCategories, { _id: "new_id", name: newCategory }],
      },
    });

    renderPage();
    await waitForEffect();

    const input = screen.getByPlaceholderText(/Enter new category/i);
    const submitButton = screen.getByRole("button", { name: /submit/i });

    await act(async () => {
      await userEvent.clear(input);
      await userEvent.type(input, newCategory);
      await userEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(`${newCategory} is created`);
      expect(screen.getByText('Manage Category')).toBeInTheDocument();
    });
  });
});
