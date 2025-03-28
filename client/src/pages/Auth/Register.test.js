import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '@testing-library/jest-dom/extend-expect';
import toast from 'react-hot-toast';
import Register from './Register';

// Mocking axios.post
jest.mock('axios');
jest.mock('react-hot-toast');

jest.mock('../../context/auth', () => ({
    useAuth: jest.fn(() => [null, jest.fn()]) // Mock useAuth hook to return null state and a mock function for setAuth
  }));

  jest.mock('../../context/cart', () => ({
    useCart: jest.fn(() => [null, jest.fn()]) // Mock useCart hook to return null state and a mock function
  }));
    
jest.mock('../../context/search', () => ({
    useSearch: jest.fn(() => [{ keyword: '' }, jest.fn()]) // Mock useSearch hook to return null state and a mock function
  }));  

  Object.defineProperty(window, 'localStorage', {
    value: {
      setItem: jest.fn(),
      getItem: jest.fn(),
      removeItem: jest.fn(),
    },
    writable: true,
  });

window.matchMedia = window.matchMedia || function() {
    return {
      matches: false,
      addListener: function() {},
      removeListener: function() {}
    };
  };
      

  describe('Register Component', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });
  
    const fillForm = (getByPlaceholderText) => {
      fireEvent.change(getByPlaceholderText('Enter Your Name'), { target: { value: 'John Doe' } });
      fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
      fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
      fireEvent.change(getByPlaceholderText('Enter Your Phone'), { target: { value: '1234567890' } });
      fireEvent.change(getByPlaceholderText('Enter Your Address'), { target: { value: '123 Street' } });
      fireEvent.change(getByPlaceholderText('Enter Your DOB'), { target: { value: '2000-01-01' } });
      fireEvent.change(getByPlaceholderText('What is Your Favorite sports'), { target: { value: 'Football' } });
    };
  
    it('should register the user successfully', async () => {
      axios.post.mockResolvedValueOnce({ data: { success: true, message: 'Register Successfully, please login' } });
  
      const { getByText, getByPlaceholderText } = render(
          <MemoryRouter initialEntries={['/register']}>
            <Routes>
              <Route path="/register" element={<Register />} />
            </Routes>
          </MemoryRouter>
        );
  
      fillForm(getByPlaceholderText);
      fireEvent.click(getByText('REGISTER'));
  
      await waitFor(() => expect(axios.post).toHaveBeenCalled());
      expect(toast.success).toHaveBeenCalledWith('Register Successfully, please login');
    });
  
    it('should display error message when registration fails with a response message', async () => {
      axios.post.mockResolvedValueOnce({ data: { success: false, message: 'User already exists' } });
  
      const { getByText, getByPlaceholderText } = render(
          <MemoryRouter initialEntries={['/register']}>
            <Routes>
              <Route path="/register" element={<Register />} />
            </Routes>
          </MemoryRouter>
        );
  
      fillForm(getByPlaceholderText);
      fireEvent.click(getByText('REGISTER'));
  
      await waitFor(() => expect(axios.post).toHaveBeenCalled());
      expect(toast.error).toHaveBeenCalledWith('User already exists');
    });
  
    it('should display generic error message when registration request fails', async () => {
      axios.post.mockRejectedValueOnce(new Error('Network Error'));
  
      const { getByText, getByPlaceholderText } = render(
          <MemoryRouter initialEntries={['/register']}>
            <Routes>
              <Route path="/register" element={<Register />} />
            </Routes>
          </MemoryRouter>
        );
  
      fillForm(getByPlaceholderText);
      fireEvent.click(getByText('REGISTER'));
  
      await waitFor(() => expect(axios.post).toHaveBeenCalled());
      expect(toast.error).toHaveBeenCalledWith('Something went wrong');
    });
  });