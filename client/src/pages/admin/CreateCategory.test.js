import React from "react";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { MemoryRouter } from "react-router-dom";
import CreateCategory from "./CreateCategory";

// Mock modules
jest.mock("axios");
jest.mock("react-hot-toast", () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

jest.mock('../../context/auth', () => ({
    useAuth: () => [null, jest.fn()],
  }));

  jest.mock('../../context/cart', () => ({
    useCart: jest.fn(() => [null, jest.fn()]) // Mock useCart hook to return null state and a mock function
  }));
    
jest.mock('../../context/search', () => ({
    useSearch: jest.fn(() => [{ keyword: '' }, jest.fn()]) // Mock useSearch hook to return null state and a mock function
  })); 

// Optionally, if AdminMenu, Layout, or CategoryForm are complex, you can mock them:
jest.mock("../../components/AdminMenu", () => () => <div>AdminMenuMock</div>);
jest.mock("../../components/Layout", () => ({ children }) => <div>{children}</div>);
jest.mock("../../components/Form/CategoryForm", () => (props) => (
  <form onSubmit={props.handleSubmit}>
    <input
      data-testid="category-input"
      value={props.value}
      onChange={(e) => props.setValue(e.target.value)}
    />
    <button type="submit">Submit</button>
  </form>
));

describe("CreateCategory Component", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("fetches and displays categories on mount", async () => {
    // Arrange
    const mockCategories = [
      { _id: "1", name: "Category A" },
      { _id: "2", name: "Category B" },
    ];
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: mockCategories },
    });

    // Act
    render(
      <MemoryRouter>
        <CreateCategory />
      </MemoryRouter>
    );

    // Assert - The table rows appear after fetch
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
      expect(screen.getByText("Category A")).toBeInTheDocument();
      expect(screen.getByText("Category B")).toBeInTheDocument();
    });
  });

  it("creates a new category on form submit", async () => {
    // Arrange
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: [] },
    });
    // The POST response for creating a category
    axios.post.mockResolvedValueOnce({
      data: { success: true },
    });
    render(
      <MemoryRouter>
        <CreateCategory />
      </MemoryRouter>
    );

    // The input is from CategoryForm. We type in "New Category"
    const categoryInput = screen.getByRole("textbox");
    fireEvent.change(categoryInput, { target: { value: "New Category" } });

    // Submit the form
    const submitButton = screen.getByRole("button", { name: /submit/i });
    fireEvent.click(submitButton);

    // Wait for axios.post to be called and toast.success
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        "/api/v1/category/create-category",
        { name: "New Category" }
      );
      expect(toast.success).toHaveBeenCalledWith("New Category is created");
    });
  });

  it("opens modal and updates a category", async () => {
    const mockCategories = [
      { _id: "1", name: "Category A" },
      { _id: "2", name: "Category B" },
    ];
    axios.get.mockResolvedValue({
      data: { success: true, category: mockCategories },
    });
    axios.put.mockResolvedValueOnce({
      data: { success: true },
    });
  
    render(
      <MemoryRouter>
        <CreateCategory />
      </MemoryRouter>
    );
  
    // Wait for the category rows
    await screen.findByText("Category A");
  
    // Click "Edit" for Category A
    const editButtons = screen.getAllByText("Edit");
    fireEvent.click(editButtons[0]);
  
    // 1) Grab the modal container by role=dialog
    const modal = screen.getByRole("dialog");
    // 2) Now do queries within the modal
    const categoryModalInput = within(modal).getByRole("textbox");
    fireEvent.change(categoryModalInput, { target: { value: "Category A Updated" } });
  
    // Submit the update
    const updateButton = within(modal).getByRole("button", { name: /submit/i });
    fireEvent.click(updateButton);
  
    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        "/api/v1/category/update-category/1",
        { name: "Category A Updated" }
      );
      expect(toast.success).toHaveBeenCalledWith("Category A Updated is updated");
    });
  });

  it("deletes a category", async () => {
    // Arrange
    const mockCategories = [{ _id: "1", name: "Category A" }];
    axios.get.mockResolvedValue({
      data: { success: true, category: mockCategories },
    });
    // The DELETE response
    axios.delete.mockResolvedValueOnce({
      data: { success: true },
    });

    render(
      <MemoryRouter>
        <CreateCategory />
      </MemoryRouter>
    );

    // Wait for "Category A" to appear
    await screen.findByText("Category A");

    // Click Delete
    const deleteButton = screen.getByText("Delete");
    fireEvent.click(deleteButton);

    await waitFor(() => {
      // Confirm axios.delete was called
      expect(axios.delete).toHaveBeenCalledWith("/api/v1/category/delete-category/1");
      // Confirm success toast
      expect(toast.success).toHaveBeenCalledWith("category is deleted");
    });
  });
});
