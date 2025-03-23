import React from "react";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { MemoryRouter } from "react-router-dom";
import CreateCategory from "./CreateCategory";

jest.mock("axios");
jest.mock("react-hot-toast", () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

jest.mock('../../context/auth', () => ({
    useAuth: () => [null, jest.fn()],
  }));

  jest.mock('../../context/cart', () => ({
    useCart: jest.fn(() => [null, jest.fn()])
  }));
    
jest.mock('../../context/search', () => ({
    useSearch: jest.fn(() => [{ keyword: '' }, jest.fn()])
  })); 

jest.mock("../../components/AdminMenu", () => () => <div>AdminMenuMock</div>);
jest.mock("../../components/Layout", () => ({ children }) => <div>{children}</div>);
jest.mock("../../components/Form/CategoryForm", () => (props) => (
    <form onSubmit={props.handleSubmit} data-testid={props["data-testid"] || "category-form"}>
      <input
        data-testid="category-input"
        value={props.value}
        onChange={(e) => props.setValue(e.target.value)}
        placeholder="Enter new category"
        type="text"
        className="form-control"
      />
      <button type="submit">Submit</button>
    </form>
  ));

describe("CreateCategory Component", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("fetches and displays categories on mount", async () => {
    const mockCategories = [
      { _id: "1", name: "Category A" },
      { _id: "2", name: "Category B" },
    ];
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: mockCategories },
    });

    render(
      <MemoryRouter>
        <CreateCategory />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
      expect(screen.getByText("Category A")).toBeInTheDocument();
      expect(screen.getByText("Category B")).toBeInTheDocument();
    });
  });

  it("creates a new category on form submit", async () => {
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: [] },
    });
    axios.post.mockResolvedValueOnce({
      data: { success: true },
    });
    render(
      <MemoryRouter>
        <CreateCategory />
      </MemoryRouter>
    );

    const categoryInput = screen.getByRole("textbox");
    fireEvent.change(categoryInput, { target: { value: "New Category" } });

    const submitButton = screen.getByRole("button", { name: /submit/i });
    fireEvent.click(submitButton);

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

    await screen.findByText("Category A");
  
    const editButtons = screen.getAllByText("Edit");
    fireEvent.click(editButtons[0]);
  
    const modal = screen.getByRole("dialog");
    const categoryModalInput = within(modal).getByRole("textbox");
    fireEvent.change(categoryModalInput, { target: { value: "Category A Updated" } });
  
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
    const mockCategories = [{ _id: "1", name: "Category A" }];
    axios.get.mockResolvedValue({
      data: { success: true, category: mockCategories },
    });
    axios.delete.mockResolvedValueOnce({
      data: { success: true },
    });

    render(
      <MemoryRouter>
        <CreateCategory />
      </MemoryRouter>
    );

    await screen.findByText("Category A");

    const deleteButton = screen.getByText("Delete");
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalledWith("/api/v1/category/delete-category/1");
      expect(toast.success).toHaveBeenCalledWith("category is deleted");
    });
  });
  
  it("shows error toast if creating category fails", async () => {
    axios.post.mockRejectedValueOnce(new Error("Create Error"));

    render(
      <MemoryRouter>
        <CreateCategory />
      </MemoryRouter>
    );

    const createInput = await waitFor(() =>
      screen.getByTestId("category-input")
    );
    fireEvent.change(createInput, { target: { value: "My New Category" } });

    const submitBtn = screen.getByRole("button", { name: /submit/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "somthing went wrong in input form"
      );
    });
  });

  it("shows error toast if fetching categories fails", async () => {
    axios.get.mockRejectedValueOnce(new Error("GetAll Error"));

    render(
      <MemoryRouter>
        <CreateCategory />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Something went wrong in getting catgeory"
      );
    });
  });

  // --- Test: Error in handleUpdate (lines 68-71) ---
  it("shows error toast if updating category fails", async () => {
    // First, GET returns a category for the table
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: [{ _id: "1", name: "Cat A" }] },
    });
    // Then, PUT rejects to simulate update failure
    axios.put.mockRejectedValueOnce(new Error("Update Error"));

    render(
      <MemoryRouter>
        <CreateCategory />
      </MemoryRouter>
    );

    // Wait for the category to appear
    await waitFor(() => {
      expect(screen.getByText("Cat A")).toBeInTheDocument();
    });

    // Click "Edit" for Cat A to open the modal
    fireEvent.click(screen.getByText("Edit"));

    // Wait for the modal (role="dialog") and then query within it
    const modal = await waitFor(() => screen.getByRole("dialog"));
    const modalInput = await waitFor(() =>
      within(modal).getByTestId("category-input")
    );
    fireEvent.change(modalInput, { target: { value: "Cat A Updated" } });

    // Click the submit button within the modal
    const modalSubmitBtn = within(modal).getByRole("button", { name: /submit/i });
    fireEvent.click(modalSubmitBtn);

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        "/api/v1/category/update-category/1",
        { name: "Cat A Updated" }
      );
      expect(toast.error).toHaveBeenCalledWith("Somthing went wrong");
    });
  });

  // --- Test: Error in handleDelete (lines 85-88) ---
  it("shows error toast if deleting category fails", async () => {
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: [{ _id: "abc", name: "Cat X" }] },
    });
    axios.delete.mockRejectedValueOnce(new Error("Delete Error"));

    render(
      <MemoryRouter>
        <CreateCategory />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Cat X")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Delete"));

    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalledWith("/api/v1/category/delete-category/abc");
      expect(toast.error).toHaveBeenCalledWith("Somtihing went wrong");
    });
  });

  // --- Test: Modal onCancel (line 145) ---
  it("closes modal on cancel", async () => {
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: [{ _id: "999", name: "Modal Cat" }] },
    });

    render(
      <MemoryRouter>
        <CreateCategory />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Modal Cat")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText("Edit"));

    // Wait for modal dialog to appear
    const modal = await waitFor(() => screen.getByRole("dialog"));
    // Confirm modal's submit button is visible (indicating modal is open)
    expect(within(modal).getByRole("button", { name: /submit/i })).toBeInTheDocument();

    const closeBtn = within(modal).getByLabelText("Close");
    fireEvent.click(closeBtn);

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
    });
  });

  it("shows error toast if creating category returns success false", async () => {
    axios.post.mockResolvedValueOnce({
      data: { success: false, message: "Creation failed" },
    });
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: [] },
    });

    render(
      <MemoryRouter>
        <CreateCategory />
      </MemoryRouter>
    );

    const createInput = await waitFor(() =>
      screen.getByTestId("category-input")
    );
    fireEvent.change(createInput, { target: { value: "My New Category" } });

    const submitBtn = screen.getByRole("button", { name: /submit/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        "/api/v1/category/create-category",
        { name: "My New Category" }
      );
      expect(toast.error).toHaveBeenCalledWith("Creation failed");
    });
  });

  it("shows error toast if updating category returns success false", async () => {
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: [{ _id: "1", name: "Cat A" }] },
    });
    axios.put.mockResolvedValueOnce({
      data: { success: false, message: "Update failed" },
    });
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: [{ _id: "1", name: "Cat A" }] },
    });

    render(
      <MemoryRouter>
        <CreateCategory />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Cat A")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Edit"));

    const modal = await waitFor(() => screen.getByRole("dialog"));
    const modalInput = within(modal).getByTestId("category-input");
    fireEvent.change(modalInput, { target: { value: "Cat A Updated" } });
    const modalSubmitBtn = within(modal).getByRole("button", { name: /submit/i });
    fireEvent.click(modalSubmitBtn);

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith("/api/v1/category/update-category/1", {
        name: "Cat A Updated",
      });
      expect(toast.error).toHaveBeenCalledWith("Update failed");
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });

  it("shows error toast if deleting category returns success false", async () => {
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: [{ _id: "abc", name: "Cat X" }] },
    });
    axios.delete.mockResolvedValueOnce({
      data: { success: false, message: "Deletion failed" },
    });
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: [{ _id: "abc", name: "Cat X" }] },
    });

    render(
      <MemoryRouter>
        <CreateCategory />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Cat A")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Delete"));

    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalledWith("/api/v1/category/delete-category/1");
      expect(toast.error).toHaveBeenCalledWith("Deletion failed");
      expect(screen.getByText("Cat A")).toBeInTheDocument();
    });
  });

});
