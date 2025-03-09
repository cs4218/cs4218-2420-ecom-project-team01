import React from "react";
import { render, within } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import { MemoryRouter } from "react-router-dom";
import Categories from "./Categories";

jest.mock("../hooks/useCategory", () => jest.fn(() => [
  { _id: "1", name: "Category 1", slug: "category-1" },
  { _id: "2", name: "Category 2", slug: "category-2" },
]));

jest.mock('../context/auth', () => ({
    useAuth: () => [null, jest.fn()],
  }));

  jest.mock('../context/cart', () => ({
    useCart: jest.fn(() => [null, jest.fn()]) // Mock useCart hook to return null state and a mock function
  }));
    
jest.mock('../context/search', () => ({
    useSearch: jest.fn(() => [{ keyword: '' }, jest.fn()]) // Mock useSearch hook to return null state and a mock function
  })); 

  describe("Categories Component", () => {
    it("renders layout title and category links correctly", () => {
      const { getByText, getAllByText, container } = render(
        <MemoryRouter>
          <Categories />
        </MemoryRouter>
      );
  
      // 1) Check the layout title
      expect(getByText("All Categories")).toBeInTheDocument();
  
      // 2) Because "Category 1" appears in the navbar and the main content,
      // let's just ensure we find BOTH instances.
      const cat1Elements = getAllByText("Category 1");
      expect(cat1Elements).toHaveLength(2);
  
      const cat2Elements = getAllByText("Category 2");
      expect(cat2Elements).toHaveLength(2);
  
      // If you want to specifically check the main body,
      // you could do something like:
      const main = container.querySelector("main");
      const cat1InMain = within(main).getByText("Category 1");
      const cat2InMain = within(main).getByText("Category 2");
      expect(cat1InMain).toBeInTheDocument();
      expect(cat2InMain).toBeInTheDocument();
    });
  });