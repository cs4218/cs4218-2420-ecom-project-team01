import { renderHook, waitFor } from "@testing-library/react";
import useCategory from "./useCategory";
import axios from "axios";

jest.mock("axios");

jest.mock("../context/auth", () => ({
  useAuth: () => [null, jest.fn()],
}));

jest.mock("../context/cart", () => ({
  useCart: jest.fn(() => [null, jest.fn()]),
}));

jest.mock("../context/search", () => ({
  useSearch: jest.fn(() => [{ keyword: "" }, jest.fn()]),
}));

describe("useCategory hook", () => {
  it("fetches categories and sets them", async () => {
    const fakeCategory = {
      data: { category: [{ _id: "1", name: "Category One" }] },
    };

    axios.get.mockResolvedValueOnce(fakeCategory);

    const { result } = renderHook(() => useCategory());
    await waitFor(() => {
      expect(result.current).toEqual([{ _id: "1", name: "Category One" }]);
    });
  });
});
