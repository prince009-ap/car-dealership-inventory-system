import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import Dashboard from "../pages/Dashboard";
import axios from "axios";

vi.mock("axios", () => {
  const mockAxios = {
    get: vi.fn(),
    post: vi.fn(),
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

const vehicleResponse = [
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

describe("DashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders successfully", () => {
    axios.get.mockResolvedValue({
      data: {
        success: true,
        vehicles: vehicleResponse
      }
    });

    render(<Dashboard />);

    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
  });

  it("fetches all vehicles from GET /api/vehicles", async () => {
    axios.get.mockResolvedValue({
      data: {
        success: true,
        vehicles: vehicleResponse
      }
    });

    render(<Dashboard />);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/vehicles");
    });
  });

  it("shows loading state while fetching vehicles", () => {
    axios.get.mockReturnValue(new Promise(() => {}));

    render(<Dashboard />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("renders vehicle cards after successful API response", async () => {
    axios.get.mockResolvedValue({
      data: {
        success: true,
        vehicles: vehicleResponse
      }
    });

    render(<Dashboard />);

    expect(await screen.findByText(/toyota/i)).toBeInTheDocument();
    expect(await screen.findByText(/tesla/i)).toBeInTheDocument();
  });

  it("displays make, model, category, price, and quantity", async () => {
    axios.get.mockResolvedValue({
      data: {
        success: true,
        vehicles: vehicleResponse
      }
    });

    render(<Dashboard />);

    expect(await screen.findByText(/fortuner/i)).toBeInTheDocument();
    expect(screen.getByText(/suv/i)).toBeInTheDocument();
    expect(screen.getByText(/4500000/i)).toBeInTheDocument();
    expect(screen.getByText(/quantity/i)).toBeInTheDocument();
  });

  it('shows the "Purchase" button for vehicles', async () => {
    axios.get.mockResolvedValue({
      data: {
        success: true,
        vehicles: vehicleResponse
      }
    });

    render(<Dashboard />);

    expect(await screen.findAllByRole("button", { name: /purchase/i })).toHaveLength(2);
  });

  it("disables the Purchase button if quantity is 0", async () => {
    const user = userEvent.setup();

    axios.get.mockResolvedValue({
      data: {
        success: true,
        vehicles: vehicleResponse
      }
    });

    render(<Dashboard />);

    const buttons = await screen.findAllByRole("button", { name: /purchase/i });
    await user.hover(buttons[1]);

    expect(buttons[1]).toBeDisabled();
  });

  it("displays the API error if request fails", async () => {
    axios.get.mockRejectedValue({
      response: {
        data: {
          message: "Failed to fetch vehicles"
        }
      }
    });

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/failed to fetch vehicles/i)).toBeInTheDocument();
    });
  });

  it('shows "No vehicles found" if the API returns an empty array', async () => {
    axios.get.mockResolvedValue({
      data: {
        success: true,
        vehicles: []
      }
    });

    render(<Dashboard />);

    expect(await screen.findByText(/no vehicles found/i)).toBeInTheDocument();
  });
});
