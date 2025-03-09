import { renderHook, waitFor, waitForNextUpdate } from '@testing-library/react-hooks';
import useCategory from './useCategory';
import axios from 'axios';

jest.mock('axios');

describe('useCategory hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch and set categories successfully', async () => {
    const fakeData = { category: [{ _id: '1', name: 'Category1' }, { _id: '2', name: 'Category2' }] };
    const fakeResponse = JSON.stringify(fakeData);
    axios.get.mockResolvedValueOnce(fakeResponse);

    const { result, waitForNextUpdate } = renderHook(() => useCategory());

    await waitForNextUpdate();

    expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
    expect(result.current).toEqual(fakeData.category);
  });

  it('should handle error and keep categories as empty', async () => {
    axios.get.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useCategory());

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
      expect(result.current).toEqual([]);
    });
  });
});
