import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import axios from "axios";
import ForgotPassword from "./ForgotPassword";
import "@testing-library/jest-dom/extend-expect";
import toast from "react-hot-toast";

jest.mock('axios');
jest.mock('react-hot-toast');

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate
}));

jest.mock('../../context/auth', () => ({
    useAuth: jest.fn(() => [null, jest.fn()])
}));

jest.mock('../../context/cart', () => ({
    useCart: jest.fn(() => [null, jest.fn()])
}));
    
jest.mock('../../context/search', () => ({
    useSearch: jest.fn(() => [{ keyword: '' }, jest.fn()])
  }));  

jest.mock("../../hooks/useCategory", () => jest.fn(() => []));

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

describe("ForgotPassword Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = () =>
    render(
        <MemoryRouter initialEntries={['/forgot-password']}>
            <Routes>
                <Route path="/forgot-password" element={<ForgotPassword />} />
            </Routes>
        </MemoryRouter>
    );

  test("renders ForgotPassword component with input fields", () => {
    renderComponent();

    expect(screen.getByText(/RESET YOUR PASSWORD/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter Your Email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter Your Answer/i)).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/Enter Your New Password/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/RESET PASSWORD/i)).toBeInTheDocument();
  });

  test("updates input values correctly and navigates to login", async () => {
    axios.post.mockResolvedValue({
        data: {
          success: true,
          message: 'Password Reset Successfully',
        },
      });
    renderComponent();

    fireEvent.change(screen.getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your Answer'), { target: { value: 'swimming' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your New Password'), { target: { value: 'newpassword123' } });

    fireEvent.click(screen.getByText('RESET PASSWORD'));

    await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith('/api/v1/auth/forgot-password', {
          email: 'test@example.com',
          answer: 'swimming',
          newPassword: 'newpassword123',
        });
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Password Reset Successfully', {
        duration: 5000,
        icon: "🙏",
        style: {
          background: "green",
          color: "white",
        },
      });
    });
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  
  test("displays error message on failed password reset", async () => {
    axios.post.mockRejectedValue({
        data: {
          success: false,
          message: 'Wrong Email Or Answer',
        },
      });
    renderComponent();

    fireEvent.change(screen.getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your Answer'), { target: { value: 'swimming' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your New Password'), { target: { value: 'newpassword123' } });

    fireEvent.click(screen.getByText('RESET PASSWORD'));

    await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Something went wrong');
      });
  });

  
  test("displays error message from API response when password reset fails", async () => {
    axios.post.mockResolvedValue({
      data: {
        success: false,
        message: 'Wrong Email Or Answer',
      },
    });
  
    renderComponent();
  
    fireEvent.change(screen.getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your Answer'), { target: { value: 'swimming' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your New Password'), { target: { value: 'newpassword123' } });
  
    fireEvent.click(screen.getByText('RESET PASSWORD'));
  
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('/api/v1/auth/forgot-password', {
        email: 'test@example.com',
        answer: 'swimming',
        newPassword: 'newpassword123',
      });
    });
  
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Wrong Email Or Answer');
    });
  });
});
