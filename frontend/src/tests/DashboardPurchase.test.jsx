import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import Dashboard from "../pages/Dashboard";
import axios from "axios";

const requestInterceptor = vi.hoisted(() => ({ current: null }));

vi.mock("axios", () => {
  const mockAxios = {
    get: vi.fn(),
    post: vi.fn((url, data, config = {}) => {
      const nextConfig = requestInterceptor.current
        ? requestInterceptor.current({ ...config })
        : config;

      return Promise.resolve({
        data: {
          url,
          data,
          config: nextConfig
        }
      });
    }),
    create: vi.fn().mockReturnThis(),
    interceptors: {
      request: {
        use: vi.fn((callback) => {
          requestInterceptor.current = callback;
          return 1;
        })
      }
    }
  };
  return {
    default: mockAxios,
    ...mockAxios
  };
});

const vehicles = [
  {
    _id: "vehicle-1",
    make: "Toyota",
    model: "Fortuner",
    category: "SUV",
    price: 4500000,
    quantity: 3
  },
  {
    _id: "vehicle-2",
    make: "Tesla",
    model: "Model 3",
    category: "Electric",
    price: 5200000,
    quantity: 0
  }
];

describe("Dashboard Purchase Vehicle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requestInterceptor.current = null;
    localStorage.clear();
    localStorage.setItem("token", "mock-jwt-token");
  });

  const renderDashboard = () => {
    axios.get.mockResolvedValueOnce({
      data: {
        success: true,
        vehicles
      }
    });

    render(<Dashboard />);
  };

  it("sends POST /api/vehicles/:id/purchase when Purchase is clicked", async () => {
    const user = userEvent.setup();

    renderDashboard();

    const purchaseButtons = await screen.findAllByRole("button", { name: /purchase/i });
    await user.click(purchaseButtons[0]);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        "/vehicles/vehicle-1/purchase",
        undefined,
        expect.any(Object)
      );
    });
  });

  it("includes Authorization header on purchase request", async () => {
    const user = userEvent.setup();

    renderDashboard();

    const purchaseButtons = await screen.findAllByRole("button", { name: /purchase/i });
    await user.click(purchaseButtons[0]);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        "/vehicles/vehicle-1/purchase",
        undefined,
        expect.objectContaining({
          headers: {
            Authorization: "Bearer mock-jwt-token"
          }
        })
      );
    });
  });

  it("disables Purchase while purchase is in progress and shows loading state", async () => {
    const user = userEvent.setup();
    let resolveRequest;

    axios.post.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveRequest = resolve;
        })
    );

    renderDashboard();

    const purchaseButtons = await screen.findAllByRole("button", { name: /purchase/i });
    await user.click(purchaseButtons[0]);

    expect(purchaseButtons[0]).toBeDisabled();
    expect(screen.getByText(/loading/i)).toBeInTheDocument();

    resolveRequest({
      data: {
        success: true
      }
    });
  });

  it("decreases quantity by one after successful purchase and refreshes dashboard", async () => {
    const user = userEvent.setup();

    axios.post.mockResolvedValueOnce({
      data: {
        success: true
      }
    });

    axios.get
      .mockResolvedValueOnce({
        data: {
          success: true,
          vehicles
        }
      })
      .mockResolvedValueOnce({
        data: {
          success: true,
          vehicles: [
            {
              ...vehicles[0],
              quantity: 2
            },
            vehicles[1]
          ]
        }
      });

    renderDashboard();

    expect(await screen.findByText(/3/i)).toBeInTheDocument();

    const purchaseButtons = await screen.findAllByRole("button", { name: /purchase/i });
    await user.click(purchaseButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/2/i)).toBeInTheDocument();
      expect(screen.getByText(/purchase successful/i)).toBeInTheDocument();
      expect(axios.get).toHaveBeenCalledTimes(2);
    });
  });

  it("keeps Purchase disabled and does not call API when quantity is already 0", async () => {
    const user = userEvent.setup();

    renderDashboard();

    const purchaseButtons = await screen.findAllByRole("button", { name: /purchase/i });
    expect(purchaseButtons[1]).toBeDisabled();

    await user.click(purchaseButtons[1]);

    expect(axios.post).not.toHaveBeenCalled();
  });

  it("shows the backend error message if purchase fails", async () => {
    const user = userEvent.setup();

    axios.post.mockRejectedValueOnce({
      response: {
        data: {
          message: "Purchase failed"
        }
      }
    });

    renderDashboard();

    const purchaseButtons = await screen.findAllByRole("button", { name: /purchase/i });
    await user.click(purchaseButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/purchase failed/i)).toBeInTheDocument();
    });
  });

  it("shows session expired message if JWT expires", async () => {
    const user = userEvent.setup();

    axios.post.mockRejectedValueOnce({
      response: {
        status: 401,
        data: {
          message: "jwt expired"
        }
      }
    });

    renderDashboard();

    const purchaseButtons = await screen.findAllByRole("button", { name: /purchase/i });
    await user.click(purchaseButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/session expired/i)).toBeInTheDocument();
    });
  });
});
