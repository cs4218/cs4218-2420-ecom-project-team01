import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import axios from "axios";
import "@testing-library/jest-dom/extend-expect";
import toast from "react-hot-toast";
import Register from "./Register";
import Login from "./Login";
import ForgotPassword from "./ForgotPassword";
import HomePage from "../HomePage";

jest.mock("axios");
jest.mock("react-hot-toast");

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


describe("User Authentication Flow", () => {
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

  test("should register and log in successfully", async () => {
    axios.post.mockResolvedValueOnce({ data: { success: true } });

    const { getByText, getByPlaceholderText } = render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText("Register"));
    await waitFor(() => screen.getByText("REGISTER FORM"));
    fillForm(getByPlaceholderText);
    fireEvent.click(getByText('REGISTER'));
    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(toast.success).toHaveBeenCalledWith(  "Register Successfully, please login");

    await waitFor(() => screen.getByText("LOGIN FORM"));
    await screen.findByPlaceholderText("Enter Your Email");
    axios.post.mockResolvedValueOnce({
      data: {
        success: true,
        user: { id: 1, name: "John Doe", email: "test@example.com" },
        token: "mockToken",
      },
    });

    fireEvent.change(screen.getByPlaceholderText("Enter Your Email"), { target: { value: "test@example.com" },});
    fireEvent.change(screen.getByPlaceholderText("Enter Your Password"), { target: { value: "password123" },});
    fireEvent.click(screen.getByText("LOGIN"));

    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(toast.success).toHaveBeenCalledWith(undefined, {
        duration: 5000,
        icon: '🙏',
        style: {
            background: 'green',
            color: 'white'
        }
    });

  });

  test("should fail to login with wrong email or password after registration", async () => {
    axios.post.mockResolvedValueOnce({ data: { success: true } });

    const { getByText, getByPlaceholderText } = render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText("Register"));
    await waitFor(() => screen.getByText("REGISTER FORM"));
    fillForm(getByPlaceholderText);
    fireEvent.click(getByText('REGISTER'));
    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(toast.success).toHaveBeenCalledWith(  "Register Successfully, please login");

    await waitFor(() => screen.getByText("LOGIN FORM"));
    await screen.findByPlaceholderText("Enter Your Email");
  
    // TESTING WRONG EMAIL
    axios.post.mockRejectedValueOnce({ response: { data: { message: "Invalid credentials" } } });
  
    fireEvent.change(getByPlaceholderText("Enter Your Email"), { target: { value: "wrong@example.com" } });
    fireEvent.change(getByPlaceholderText("Enter Your Password"), { target: { value: "password123" } });
    fireEvent.click(getByText("LOGIN"));
  
    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(toast.error).toHaveBeenCalledWith("Something went wrong");
  
    // TESTING WRONG PASSWORD
    axios.post.mockResolvedValueOnce({
      data: { success: false, message: "Invalid password" },
    });
  
    fireEvent.change(getByPlaceholderText("Enter Your Email"), { target: { value: "test@example.com" } });
    fireEvent.change(getByPlaceholderText("Enter Your Password"), { target: { value: "wrongpassword" } });
    fireEvent.click(getByText("LOGIN"));
  
    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(toast.error).toHaveBeenCalledWith("Invalid password");
  });
  

  it("should allow the user to reset the password via Forgot Password after registration", async () => {
    axios.post.mockResolvedValueOnce({ data: { success: true } });
  
    const { getByText, getByPlaceholderText } = render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Routes>
      </MemoryRouter>
    );
  
    fireEvent.click(screen.getByText("Register"));
    await waitFor(() => screen.getByText("REGISTER FORM"));
    fillForm(getByPlaceholderText);
    fireEvent.click(getByText('REGISTER'));
    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(toast.success).toHaveBeenCalledWith(  "Register Successfully, please login");

    await waitFor(() => screen.getByText("LOGIN FORM"));
    await screen.findByPlaceholderText("Enter Your Email");
  
    fireEvent.click(getByText("Forgot Password"));
  
    await waitFor(() => screen.getByText("RESET YOUR PASSWORD"));
  
    fireEvent.change(getByPlaceholderText("Enter Your Email"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(getByPlaceholderText("Enter Your Answer"), {
      target: { value: "Football" },
    });
    fireEvent.change(getByPlaceholderText("Enter Your New Password"), {
      target: { value: "newpassword123" },
    });
  
    axios.post.mockResolvedValueOnce({
      data: { success: true, message: "Password Reset Successfully" },
    });
  
    fireEvent.click(getByText("RESET PASSWORD"));
  
    await waitFor(() => expect(axios.post).toHaveBeenCalledWith("/api/v1/auth/forgot-password", {
      email: "test@example.com",
      answer: "Football",
      newPassword: "newpassword123",
    }));
  
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Password Reset Successfully", {
        duration: 5000,
        icon: "🙏",
        style: { background: "green", color: "white" },
      });
    });
  
  });
  
});
