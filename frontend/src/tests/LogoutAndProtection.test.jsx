import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import axios from "axios";
import App from "../App";

vi.mock("axios", () => {
  const mockAxios = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    create: vi.fn().mockReturnThis(),
    interceptors: {
      request: {
        use: vi.fn()
      }
    }
  };
  return {
    default: mockAxios,
    ...mockAxios
  };
});

describe("Logout and Protected Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  // 1 & 2. Dashboard cannot be opened without a token and redirects to Login
  it("redirects to login if token is missing when accessing dashboard", async () => {
    localStorage.removeItem("token");

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <App />
      </MemoryRouter>
    );

    // Verify user is redirected to Login page and Dashboard is not shown
    await waitFor(() => {
      expect(screen.getByText(/login/i)).toBeInTheDocument();
      expect(screen.queryByText(/dashboard/i)).not.toBeInTheDocument();
    });
  });

  // 3. Clicking Logout clears localStorage and redirects to Login
  it("clears localStorage token and user, and redirects to login when logout is clicked", async () => {
    localStorage.setItem("token", "fake-token");
    localStorage.setItem("user", JSON.stringify({ role: "USER", email: "user@test.com" }));

    // Mock API call for fetching vehicles successfully on dashboard load
    axios.get.mockResolvedValue({
      data: {
        success: true,
        vehicles: []
      }
    });

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <App />
      </MemoryRouter>
    );

    // Wait for Dashboard page to load
    await screen.findByText(/dashboard/i);

    // Find and click Logout button
    const logoutBtn = screen.getByRole("button", { name: /logout/i });
    await userEvent.click(logoutBtn);

    // Verify localStorage has been cleared
    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();

    // Verify user is redirected to Login
    await waitFor(() => {
      expect(screen.getByText(/login/i)).toBeInTheDocument();
    });
  });

  // 4. Expired JWT clears localStorage, redirects to Login, and shows "Session expired"
  it("clears localStorage, redirects to login, and shows session expired message on expired JWT error", async () => {
    localStorage.setItem("token", "expired-token");
    localStorage.setItem("user", JSON.stringify({ role: "USER", email: "user@test.com" }));

    // Mock API call to return 401 Session Expired on initial fetch
    axios.get.mockRejectedValue({
      response: {
        status: 401,
        data: {
          message: "jwt expired"
        }
      }
    });

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <App />
      </MemoryRouter>
    );

    // Verify localStorage is cleared
    await waitFor(() => {
      expect(localStorage.getItem("token")).toBeNull();
      expect(localStorage.getItem("user")).toBeNull();
    });

    // Verify user is redirected to Login and shows "Session expired" message
    await waitFor(() => {
      expect(screen.getByText(/session expired/i)).toBeInTheDocument();
      expect(screen.getByText(/login/i)).toBeInTheDocument();
    });
  });

  // 5. Protected routes cannot be accessed after logout
  it("does not allow accessing dashboard after logout", async () => {
    localStorage.setItem("token", "fake-token");
    axios.get.mockResolvedValue({
      data: {
        success: true,
        vehicles: []
      }
    });

    const { unmount } = render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <App />
      </MemoryRouter>
    );

    // Load dashboard
    await screen.findByText(/dashboard/i);

    // Click logout
    const logoutBtn = screen.getByRole("button", { name: /logout/i });
    await userEvent.click(logoutBtn);

    // Unmount and try to remount at /dashboard
    unmount();

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <App />
      </MemoryRouter>
    );

    // Verify user is sent to Login page and not dashboard
    await waitFor(() => {
      expect(screen.getByText(/login/i)).toBeInTheDocument();
      expect(screen.queryByText(/dashboard/i)).not.toBeInTheDocument();
    });
  });

  // 6. Navbar shows Logout button only when authenticated
  it("shows Logout button only when authenticated", async () => {
    // 1. Not authenticated scenario
    localStorage.removeItem("token");
    const { rerender } = render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>
    );

    expect(screen.queryByRole("button", { name: /logout/i })).not.toBeInTheDocument();

    // 2. Authenticated scenario
    localStorage.setItem("token", "fake-token");
    axios.get.mockResolvedValue({
      data: {
        success: true,
        vehicles: []
      }
    });

    rerender(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <App />
      </MemoryRouter>
    );

    // Verify Logout button is present in the document
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /logout/i })).toBeInTheDocument();
    });
  });
});
