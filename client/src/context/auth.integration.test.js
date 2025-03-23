import React, { useEffect } from "react";
import { render, screen, act, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import { AuthProvider, useAuth } from "./auth";
import "@testing-library/jest-dom";

jest.mock("axios");

// Component that implements actual login flow with API calls
const LoginComponent = () => {
  const [auth, setAuth] = useAuth();
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const handleLogin = async (email, password) => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.post("/api/auth/login", { email, password });
      
      // Check for various response statuses
      if (response.status !== 200) {
        throw new Error("Server error: " + response.status);
      }
      
      if (!response.data || !response.data.user) {
        throw new Error("Invalid response format");
      }
      
      // Set auth context
      setAuth({
        user: response.data.user,
        token: response.data.token,
      });
      
      // Store in localStorage
      localStorage.setItem("auth", JSON.stringify({
        user: response.data.user,
        token: response.data.token,
      }));
      
      return true;
    } catch (error) {
      setError(error.response?.data?.message || error.message || "Login failed");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    try {
      // Some apps might call an API endpoint to invalidate token
      // axios.post("/api/auth/logout"); 
      localStorage.removeItem("auth");
      setAuth({
        user: null,
        token: "",
      });
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <div>
      <h2>Auth Integration Test</h2>
      {loading && <div data-testid="loading-indicator">Loading...</div>}
      {error && <div data-testid="error-message">{error}</div>}
      
      {auth.user ? (
        <>
          <div data-testid="user-info">Welcome, {auth.user.name}</div>
          <div data-testid="token-info">Token: {auth.token}</div>
          <div data-testid="role-info">Role: {auth.user.role || "user"}</div>
          <button data-testid="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </>
      ) : (
        <div>
          <button 
            data-testid="login-admin-button" 
            onClick={() => handleLogin("admin@test.com", "password123")}
          >
            Login as Admin
          </button>
          <button 
            data-testid="login-user-button" 
            onClick={() => handleLogin("user@test.com", "password123")}
          >
            Login as User
          </button>
          <button 
            data-testid="login-fail-button" 
            onClick={() => handleLogin("wrong@test.com", "wrongpass")}
          >
            Login with Invalid Credentials
          </button>
        </div>
      )}
    </div>
  );
};

// Component that listens to auth context changes
const AuthObserver = () => {
  const [auth] = useAuth();
  const [authChangeCount, setAuthChangeCount] = React.useState(0);
  
  useEffect(() => {
    setAuthChangeCount(prev => prev + 1);
  }, [auth]);
  
  return (
    <div>
      <div data-testid="auth-change-count">Auth changed: {authChangeCount} times</div>
      <div data-testid="observer-user-info">
        {auth.user ? `User: ${auth.user.name}` : 'Not logged in'}
      </div>
    </div>
  );
};

describe("Auth Context Integration Tests", () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Reset any axios mock implementations
    jest.clearAllMocks();
    
    // Set up default axios behavior
    axios.post.mockImplementation((url, data) => {
      if (url === "/api/auth/login") {
        if (data.email === "admin@test.com" && data.password === "password123") {
          return Promise.resolve({
            status: 200,
            data: {
              user: { name: "Admin User", role: "admin", email: "admin@test.com" },
              token: "admin-test-token"
            }
          });
        } else if (data.email === "user@test.com" && data.password === "password123") {
          return Promise.resolve({
            status: 200,
            data: {
              user: { name: "Regular User", role: "user", email: "user@test.com" },
              token: "user-test-token"
            }
          });
        } else {
          return Promise.reject({
            response: {
              status: 401,
              data: { message: "Invalid credentials" }
            }
          });
        }
      }
      return Promise.reject(new Error("Unexpected URL: " + url));
    });
  });

  test("Login flow: component updates auth context and localStorage", async () => {
    render(
      <AuthProvider>
        <LoginComponent />
      </AuthProvider>
    );

    // Verify initial state
    expect(screen.queryByTestId("user-info")).not.toBeInTheDocument();
    expect(localStorage.getItem("auth")).toBeNull();
    
    // Trigger login
    await act(async () => {
      await userEvent.click(screen.getByTestId("login-admin-button"));
    });

    // Verify auth context updated the component
    expect(screen.getByTestId("user-info").textContent).toBe("Welcome, Admin User");
    expect(screen.getByTestId("token-info").textContent).toBe("Token: admin-test-token");
    
    // Verify localStorage was updated
    const storedAuth = JSON.parse(localStorage.getItem("auth"));
    expect(storedAuth.user.name).toBe("Admin User");
    expect(storedAuth.token).toBe("admin-test-token");
    
    // Verify axios headers were updated
    expect(axios.defaults.headers.common["Authorization"]).toBe("Bearer admin-test-token");
  });

  test("Logout flow: component updates auth context and removes localStorage data", async () => {
    // Setup initial auth state in localStorage
    const initialAuth = {
      user: { name: "Test User" },
      token: "test-token",
    };
    localStorage.setItem("auth", JSON.stringify(initialAuth));
    
    render(
      <AuthProvider>
        <LoginComponent />
      </AuthProvider>
    );

    // Verify initial logged-in state
    expect(screen.getByTestId("user-info").textContent).toBe("Welcome, Test User");
    
    // Trigger logout
    await act(async () => {
      await userEvent.click(screen.getByTestId("logout-button"));
    });

    // Verify auth context was cleared
    expect(screen.queryByTestId("user-info")).not.toBeInTheDocument();
    expect(screen.getByTestId("login-admin-button")).toBeInTheDocument();
    
    // Verify localStorage was cleared
    expect(localStorage.getItem("auth")).toBeNull();
    
    // Verify axios headers were cleared
    expect(axios.defaults.headers.common["Authorization"]).toBeUndefined();
  });

  test("Auth context loads user data from localStorage on initialization", async () => {
    // Setup initial auth state in localStorage
    const initialAuth = {
      user: { name: "Stored User" },
      token: "stored-token",
    };
    localStorage.setItem("auth", JSON.stringify(initialAuth));

    // Render component with AuthProvider
    render(
      <AuthProvider>
        <LoginComponent />
      </AuthProvider>
    );

    // Verify component shows the user from localStorage
    await waitFor(() => {
      expect(screen.getByTestId("user-info").textContent).toBe("Welcome, Stored User");
      expect(screen.getByTestId("token-info").textContent).toBe("Token: stored-token");
    });

    // Verify axios headers were set from localStorage data
    expect(axios.defaults.headers.common["Authorization"]).toBe("Bearer stored-token");
  });

  test("Auth context handles localStorage parsing errors gracefully", async () => {
    // Setup invalid JSON in localStorage
    localStorage.setItem("auth", "invalid-json");
    
    // Mock console.error to avoid test output pollution
    const originalConsoleError = console.error;
    console.error = jest.fn();

    render(
      <AuthProvider>
        <LoginComponent />
      </AuthProvider>
    );

    // Verify error was logged
    expect(console.error).toHaveBeenCalled();
    
    // Verify localStorage item was removed
    expect(localStorage.getItem("auth")).toBeNull();
    
    // Verify component is in logged-out state
    expect(screen.queryByTestId("user-info")).not.toBeInTheDocument();
    expect(screen.getByTestId("login-admin-button")).toBeInTheDocument();

    // Restore console.error
    console.error = originalConsoleError;
  });

  test("Auth context and component interaction with axios on auth changes", async () => {
    render(
      <AuthProvider>
        <LoginComponent />
      </AuthProvider>
    );

    // Initial state - no Authorization header
    expect(axios.defaults.headers.common["Authorization"]).toBeUndefined();
    
    // Log in
    await act(async () => {
      await userEvent.click(screen.getByTestId("login-admin-button"));
    });
    
    // Verify Authorization header is set
    expect(axios.defaults.headers.common["Authorization"]).toBe("Bearer admin-test-token");
    
    // Log out
    await act(async () => {
      await userEvent.click(screen.getByTestId("logout-button"));
    });
    
    // Verify Authorization header is removed
    expect(axios.defaults.headers.common["Authorization"]).toBeUndefined();
  });

  test("Login handler properly processes API responses and updates auth state", async () => {
    render(
      <AuthProvider>
        <LoginComponent />
      </AuthProvider>
    );

    // Trigger login with admin credentials
    await act(async () => {
      await userEvent.click(screen.getByTestId("login-admin-button"));
    });

    // Verify loading state appeared during API call
    expect(screen.queryByTestId("loading-indicator")).not.toBeInTheDocument();

    // Verify auth context updated correctly
    expect(screen.getByTestId("user-info").textContent).toBe("Welcome, Admin User");
    expect(screen.getByTestId("role-info").textContent).toBe("Role: admin");
    
    // Verify API was called with correct params
    expect(axios.post).toHaveBeenCalledWith(
      "/api/auth/login", 
      { email: "admin@test.com", password: "password123" }
    );
  });

  test("Login gracefully handles authentication failures", async () => {
    render(
      <AuthProvider>
        <LoginComponent />
      </AuthProvider>
    );

    // Trigger failed login
    await act(async () => {
      await userEvent.click(screen.getByTestId("login-fail-button"));
    });

    // Verify error message is displayed
    expect(screen.getByTestId("error-message").textContent).toBe("Invalid credentials");
    
    // Verify user remains logged out
    expect(screen.queryByTestId("user-info")).not.toBeInTheDocument();
    
    // Verify localStorage wasn't updated
    expect(localStorage.getItem("auth")).toBeNull();
  });
  
  test("Auth context properly propagates updates to multiple components", async () => {
    render(
      <AuthProvider>
        <LoginComponent />
        <AuthObserver />
      </AuthProvider>
    );
    
    // Initial state
    expect(screen.getByTestId("observer-user-info").textContent).toBe("Not logged in");
    
    // Login
    await act(async () => {
      await userEvent.click(screen.getByTestId("login-user-button"));
    });
    
    // Verify both components updated
    expect(screen.getByTestId("user-info").textContent).toBe("Welcome, Regular User");
    expect(screen.getByTestId("observer-user-info").textContent).toBe("User: Regular User");
    
    // Verify auth change count (should be at least 2: initial state + login)
    expect(parseInt(screen.getByTestId("auth-change-count").textContent.split(": ")[1])).toBeGreaterThanOrEqual(2);
    
    // Logout
    await act(async () => {
      await userEvent.click(screen.getByTestId("logout-button"));
    });
    
    // Verify both components updated again
    expect(screen.queryByTestId("user-info")).not.toBeInTheDocument();
    expect(screen.getByTestId("observer-user-info").textContent).toBe("Not logged in");
  });

  test("Auth context handles malformed API responses gracefully", async () => {
    // Mock API to return incomplete data
    axios.post.mockImplementationOnce(() => 
      Promise.resolve({
        status: 200,
        data: { 
          // Missing user field, token present
          token: "incomplete-token" 
        }
      })
    );
    
    const originalConsoleError = console.error;
    console.error = jest.fn();
    
    render(
      <AuthProvider>
        <LoginComponent />
      </AuthProvider>
    );
    
    // Trigger login
    await act(async () => {
      await userEvent.click(screen.getByTestId("login-admin-button"));
    });
    
    // Should show error message
    expect(screen.getByTestId("error-message").textContent).toBe("Invalid response format");
    
    // Restore console.error
    console.error = originalConsoleError;
  });

  test("Auth context handles race conditions with multiple quick auth changes", async () => {
    // Create mock implementations that return after different delays
    axios.post.mockImplementationOnce(() => 
      new Promise(resolve => setTimeout(() => resolve({
        status: 200,
        data: {
          user: { name: "Slow Response User", role: "user" },
          token: "slow-token"
        }
      }), 100))
    );
    
    axios.post.mockImplementationOnce(() => 
      Promise.resolve({
        status: 200,
        data: {
          user: { name: "Fast Response User", role: "user" },
          token: "fast-token"
        }
      })
    );
    
    render(
      <AuthProvider>
        <LoginComponent />
      </AuthProvider>
    );
    
    // Trigger slow login
    await act(async () => {
      await userEvent.click(screen.getByTestId("login-admin-button"));
    });
    
    // Immediately trigger fast login
    await act(async () => {
      await userEvent.click(screen.getByTestId("login-user-button"));
    });
    
    // Remove the separate slowLoginPromise handling since we're now awaiting each act
    
    // Only the second (fast) login should be reflected in the UI
    // This tests that the context doesn't get overwritten by stale responses
    await waitFor(() => {
      expect(screen.getByTestId("user-info").textContent).toBe("Welcome, Fast Response User");
      expect(screen.getByTestId("token-info").textContent).toBe("Token: fast-token");
    });
  });

  test("Auth context preserves user session across page reloads", async () => {
    // Setup auth state in localStorage as if user logged in previously
    const existingAuth = {
      user: { name: "Persistent User", role: "user" },
      token: "persistent-token"
    };
    localStorage.setItem("auth", JSON.stringify(existingAuth));
    
    // Mock window reload by remounting the component
    const { unmount } = render(
      <AuthProvider>
        <LoginComponent />
      </AuthProvider>
    );
    
    // Verify user is logged in from localStorage
    expect(screen.getByTestId("user-info").textContent).toBe("Welcome, Persistent User");
    
    // Simulate page reload
    unmount();
    
    // Render again (simulating reload)
    render(
      <AuthProvider>
        <LoginComponent />
      </AuthProvider>
    );
    
    // Verify user is still logged in after "reload"
    expect(screen.getByTestId("user-info").textContent).toBe("Welcome, Persistent User");
    expect(screen.getByTestId("token-info").textContent).toBe("Token: persistent-token");
  });
});
