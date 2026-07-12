import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { vi } from "vitest";
import Register from "../pages/Register";
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

const renderRegisterPage = () =>
  render(
    <MemoryRouter initialEntries={["/register"]}>
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<h1>Login Page</h1>} />
      </Routes>
    </MemoryRouter>
  );

describe("RegisterPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("renders the register page", () => {
    renderRegisterPage();

    expect(screen.getByText(/register/i)).toBeInTheDocument();
  });

  it("shows the name input", () => {
    renderRegisterPage();

    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
  });

  it("shows the email input", () => {
    renderRegisterPage();

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  it("shows the password input", () => {
    renderRegisterPage();

    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
  });

  it("shows the confirm password input", () => {
    renderRegisterPage();

    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
  });

  it("shows the register button", () => {
    renderRegisterPage();

    expect(screen.getByRole("button", { name: /register/i })).toBeInTheDocument();
  });

  it('shows the "Already have an account? Login" link', () => {
    renderRegisterPage();

    expect(screen.getByRole("link", { name: /already have an account\? login/i })).toBeInTheDocument();
  });

  it('navigates to "/" when the login link is clicked', async () => {
    const user = userEvent.setup();

    renderRegisterPage();

    await user.click(screen.getByRole("link", { name: /login/i }));

    expect(screen.getByText(/login page/i)).toBeInTheDocument();
  });

  it("shows validation when fields are empty", async () => {
    const user = userEvent.setup();

    renderRegisterPage();

    await user.click(screen.getByRole("button", { name: /register/i }));

    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/^password is required$/i)).toBeInTheDocument();
      expect(screen.getByText(/confirm password is required/i)).toBeInTheDocument();
    });
  });

  it("shows validation when password and confirm password do not match", async () => {
    const user = userEvent.setup();

    renderRegisterPage();

    await user.type(screen.getByLabelText(/name/i), "Prince");
    await user.type(screen.getByLabelText(/email/i), "prince@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "secret123");
    await user.type(screen.getByLabelText(/confirm password/i), "secret321");
    await user.click(screen.getByRole("button", { name: /register/i }));

    expect(screen.getByText(/passwords must match/i)).toBeInTheDocument();
  });

  it("calls the register API with valid data", async () => {
    const user = userEvent.setup();

    axios.post.mockResolvedValue({
      data: {
        success: true,
        user: {
          id: "user-id-1",
          name: "Prince",
          email: "prince@example.com"
        }
      }
    });

    renderRegisterPage();

    await user.type(screen.getByLabelText(/name/i), "Prince");
    await user.type(screen.getByLabelText(/email/i), "prince@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "secret123");
    await user.type(screen.getByLabelText(/confirm password/i), "secret123");
    await user.click(screen.getByRole("button", { name: /register/i }));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith("/auth/register", {
        name: "Prince",
        email: "prince@example.com",
        password: "secret123"
      });
    });
  });

  it("shows loading state while the request is pending", async () => {
    const user = userEvent.setup();
    let resolveRequest;

    axios.post.mockReturnValue(
      new Promise((resolve) => {
        resolveRequest = resolve;
      })
    );

    renderRegisterPage();

    await user.type(screen.getByLabelText(/name/i), "Prince");
    await user.type(screen.getByLabelText(/email/i), "prince@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "secret123");
    await user.type(screen.getByLabelText(/confirm password/i), "secret123");
    await user.click(screen.getByRole("button", { name: /register/i }));

    expect(screen.getByText(/loading/i)).toBeInTheDocument();

    resolveRequest({
      data: {
        success: true
      }
    });
  });

  it("shows the backend error message", async () => {
    const user = userEvent.setup();

    axios.post.mockRejectedValue({
      response: {
        data: {
          message: "Email already exists"
        }
      }
    });

    renderRegisterPage();

    await user.type(screen.getByLabelText(/name/i), "Prince");
    await user.type(screen.getByLabelText(/email/i), "prince@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "secret123");
    await user.type(screen.getByLabelText(/confirm password/i), "secret123");
    await user.click(screen.getByRole("button", { name: /register/i }));

    await waitFor(() => {
      expect(screen.getByText(/email already exists/i)).toBeInTheDocument();
    });
  });

  it('navigates to "/" after successful registration', async () => {
    const user = userEvent.setup();

    axios.post.mockResolvedValue({
      data: {
        success: true
      }
    });

    renderRegisterPage();

    await user.type(screen.getByLabelText(/name/i), "Prince");
    await user.type(screen.getByLabelText(/email/i), "prince@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "secret123");
    await user.type(screen.getByLabelText(/confirm password/i), "secret123");
    await user.click(screen.getByRole("button", { name: /register/i }));

    await waitFor(() => {
      expect(screen.getByText(/login page/i)).toBeInTheDocument();
    });
  });
});
