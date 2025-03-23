import { renderHook, waitFor } from "@testing-library/react";
import axios from "axios";
import useCategory from "../hooks/useCategory";

jest.mock("axios");

describe("useCategory hook", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should fetch and return categories on mount", async () => {
    const mockCategories = [
      { _id: "1", name: "Books", slug: "books" },
      { _id: "2", name: "Electronics", slug: "electronics" },
    ];

    axios.get.mockResolvedValueOnce({ data: { category: mockCategories } });

    const { result } = renderHook(() => useCategory());

    await waitFor(() => {
      expect(result.current).toEqual(mockCategories);
    });

    expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
  });

  it("should handle API failure and return an empty array", async () => {
    axios.get.mockRejectedValueOnce(new Error("API Error"));
    console.log = jest.fn();
    
    const { result } = renderHook(() => useCategory());

    await waitFor(() => {
      expect(result.current).toEqual([]);
    });

    expect(console.log).toHaveBeenCalledWith(expect.any(Error));
  });
});