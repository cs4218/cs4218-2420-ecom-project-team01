import React from "react";
import {
  render,
  screen,
  act,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import toast from "react-hot-toast";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "../../context/auth";
import { SearchProvider } from "../../context/search";
import { CartProvider } from "../../context/cart";
import CreateCategory from "./CreateCategory";

jest.mock("axios");
jest.spyOn(toast, "success");
jest.spyOn(toast, "error");

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

describe("CreateCategory Page", () => {
  const mockCategories = [
    { _id: "cat1", name: "Books" },
    { _id: "cat2", name: "Electronics" },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    axios.get.mockImplementation((url) => {
      if (url === "/api/v1/category/get-category") {
        return Promise.resolve({
          data: { success: true, category: mockCategories },
        });
      }
    });
  });

  test("should fetch and display categories in table", async () => {
    renderPage();

    const categoryTable = await screen.findByRole("table");
    const tableUtils = within(categoryTable);

    expect(tableUtils.getByText("Books")).toBeInTheDocument();
    expect(tableUtils.getByText("Electronics")).toBeInTheDocument();
    expect(screen.getByText("Manage Category")).toBeInTheDocument();
  });

  test("should create a new category", async () => {
    axios.post.mockResolvedValue({
      data: { success: true, category: { _id: "cat3", name: "NewCat" } },
    });

    renderPage();

    const input = await screen.findByPlaceholderText("Enter new category");
    await act(async () => {
      userEvent.clear(input);
      userEvent.type(input, "NewCat");
    });

    userEvent.click(screen.getByRole("button", { name: /submit/i }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("NewCat is created");
    });
  });

  test("should open modal and edit category", async () => {
    axios.put.mockResolvedValue({
      data: { success: true },
    });

    renderPage();
    const categoryTable = await screen.findByRole("table");
    const rows = within(categoryTable).getAllByRole("row");
    const booksRow = rows.find((row) => within(row).queryByText("Books"));

    const editButton = within(booksRow).getByText("Edit");
    await act(async () => userEvent.click(editButton));

    const modalInput = await screen.findByDisplayValue("Books");
    await act(async () => {
      userEvent.clear(modalInput);
      userEvent.type(modalInput, "Updated Books");
    });

    userEvent.click(screen.getByRole("button", { name: /submit/i }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Category is updated");
    });
  });

  test("should delete a category", async () => {
    axios.delete.mockResolvedValue({ data: { success: true } });

    renderPage();
    const categoryTable = await screen.findByRole("table");
    const rows = within(categoryTable).getAllByRole("row");
    const electronicsRow = rows.find((row) =>
      within(row).queryByText("Electronics")
    );

    const deleteButton = within(electronicsRow).getByText("Delete");
    await act(async () => userEvent.click(deleteButton));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Category is deleted");
    });
  });
});
