import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import CategoryForm from "./CategoryForm";

jest.mock('../context/auth', () => ({
    useAuth: () => [null, jest.fn()],
  }));

  jest.mock('../context/cart', () => ({
    useCart: jest.fn(() => [null, jest.fn()]) // Mock useCart hook to return null state and a mock function
  }));
    
jest.mock('../context/search', () => ({
    useSearch: jest.fn(() => [{ keyword: '' }, jest.fn()]) // Mock useSearch hook to return null state and a mock function
  })); 
  
describe("CategoryForm", () => {
  it("renders input and submit button", () => {
    render(<CategoryForm handleSubmit={jest.fn()} value="" setValue={jest.fn()} />);

    // Check for the input and button
    expect(screen.getByPlaceholderText("Enter new category")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /submit/i })).toBeInTheDocument();
  });

  it("calls setValue on input change", () => {
    const mockSetValue = jest.fn();
    render(<CategoryForm handleSubmit={jest.fn()} value="" setValue={mockSetValue} />);

    const input = screen.getByPlaceholderText("Enter new category");
    fireEvent.change(input, { target: { value: "Test Category" } });

    expect(mockSetValue).toHaveBeenCalledWith("Test Category");
  });

  it("calls handleSubmit on form submit", () => {
    const mockHandleSubmit = jest.fn();
    render(<CategoryForm handleSubmit={mockHandleSubmit} value="" setValue={jest.fn()} />);

    const form = screen.getByRole("form"); 
    // If "role=form" is not recognized by default, or the form doesn't have role,
    // you can get by text or container query. 
    // But let's try a simpler approach: 
    // Grab the button and click it, or do a .submit

    const submitBtn = screen.getByRole("button", { name: /submit/i });
    fireEvent.click(submitBtn);

    expect(mockHandleSubmit).toHaveBeenCalledTimes(1);
  });
});
