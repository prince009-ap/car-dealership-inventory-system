import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import LoginPage from "../pages/LoginPage";
import axios from "axios";

vi.mock("axios", () => {
  const mockAxios = {
    post: vi.fn(),
    get: vi.fn(),
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

describe("LoginPage", () => {
  it("renders the login page", () => {
    render(<LoginPage />);

    expect(screen.getByText(/login/i)).toBeInTheDocument();
  });

  it("displays the email input", () => {
    render(<LoginPage />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  it("displays the password input", () => {
    render(<LoginPage />);

    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it("displays the login button", () => {
    render(<LoginPage />);

    expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument();
  });

  it("shows validation when both fields are empty", async () => {
    render(<LoginPage />);

    fireEvent.click(screen.getByRole("button", { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
  });

  it("calls the login API when valid credentials are submitted", async () => {
    axios.post.mockResolvedValue({
      data: {
        success: true,
        token: "fake-token",
        user: { id: "user-id-1", role: "USER" }
      }
    });

    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "john@example.com" }
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "secret123" }
    });
    fireEvent.click(screen.getByRole("button", { name: /login/i }));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalled();
    });
  });

  it("shows loading state while the request is pending", async () => {
    let resolveRequest;

    axios.post.mockReturnValue(
      new Promise((resolve) => {
        resolveRequest = resolve;
      })
    );

    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "john@example.com" }
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "secret123" }
    });
    fireEvent.click(screen.getByRole("button", { name: /login/i }));

    expect(screen.getByText(/loading/i)).toBeInTheDocument();

    resolveRequest({
      data: {
        success: true,
        token: "fake-token",
        user: { id: "user-id-1", role: "USER" }
      }
    });
  });

  it("shows an error message if login fails", async () => {
    axios.post.mockRejectedValue({
      response: {
        data: {
          message: "Invalid credentials"
        }
      }
    });

    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "john@example.com" }
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "wrong-password" }
    });
    fireEvent.click(screen.getByRole("button", { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });
});
