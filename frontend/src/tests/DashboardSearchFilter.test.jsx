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

const initialVehicles = [
  {
    _id: "vehicle-1",
    make: "Toyota",
    model: "Fortuner",
    category: "SUV",
    price: 4500000,
    quantity: 3
  }
];

const renderDashboard = () => {
  axios.get.mockResolvedValueOnce({
    data: {
      success: true,
      vehicles: initialVehicles
    }
  });

  return render(<Dashboard />);
};

describe("Dashboard Search & Filter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("supports search by make", async () => {
    const user = userEvent.setup();

    renderDashboard();

    await screen.findByText(/toyota/i);
    await user.type(screen.getByLabelText(/make/i), "Toyota");

    expect(screen.getByLabelText(/make/i)).toHaveValue("Toyota");
  });

  it("supports search by model", async () => {
    const user = userEvent.setup();

    renderDashboard();

    await screen.findByText(/toyota/i);
    await user.type(screen.getByLabelText(/model/i), "Fortuner");

    expect(screen.getByLabelText(/model/i)).toHaveValue("Fortuner");
  });

  it("supports filter by category", async () => {
    const user = userEvent.setup();

    renderDashboard();

    await screen.findByText(/toyota/i);
    await user.selectOptions(screen.getByLabelText(/category/i), "SUV");

    expect(screen.getByLabelText(/category/i)).toHaveValue("SUV");
  });

  it("supports filter by minimum price", async () => {
    const user = userEvent.setup();

    renderDashboard();

    await screen.findByText(/toyota/i);
    await user.type(screen.getByLabelText(/minimum price/i), "1000000");

    expect(screen.getByLabelText(/minimum price/i)).toHaveValue(1000000);
  });

  it("supports filter by maximum price", async () => {
    const user = userEvent.setup();

    renderDashboard();

    await screen.findByText(/toyota/i);
    await user.type(screen.getByLabelText(/maximum price/i), "5000000");

    expect(screen.getByLabelText(/maximum price/i)).toHaveValue(5000000);
  });

  it("calls GET /api/vehicles/search with correct query parameters when Search is clicked", async () => {
    const user = userEvent.setup();

    axios.get
      .mockResolvedValueOnce({
        data: {
          success: true,
          vehicles: initialVehicles
        }
      })
      .mockResolvedValueOnce({
        data: {
          success: true,
          vehicles: initialVehicles
        }
      });

    render(<Dashboard />);

    await screen.findByText(/toyota/i);
    await user.type(screen.getByLabelText(/make/i), "Toyota");
    await user.type(screen.getByLabelText(/model/i), "Fortuner");
    await user.selectOptions(screen.getByLabelText(/category/i), "SUV");
    await user.type(screen.getByLabelText(/minimum price/i), "1000000");
    await user.type(screen.getByLabelText(/maximum price/i), "5000000");
    await user.click(screen.getByRole("button", { name: /search/i }));

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/vehicles/search", {
        params: {
          make: "Toyota",
          model: "Fortuner",
          category: "SUV",
          minPrice: "1000000",
          maxPrice: "5000000"
        }
      });
    });
  });

  it("clears all filters when Clear Filters is clicked", async () => {
    const user = userEvent.setup();

    renderDashboard();

    await screen.findByText(/toyota/i);
    await user.type(screen.getByLabelText(/make/i), "Toyota");
    await user.type(screen.getByLabelText(/model/i), "Fortuner");
    await user.selectOptions(screen.getByLabelText(/category/i), "SUV");
    await user.type(screen.getByLabelText(/minimum price/i), "1000000");
    await user.type(screen.getByLabelText(/maximum price/i), "5000000");
    await user.click(screen.getByRole("button", { name: /clear filters/i }));

    expect(screen.getByLabelText(/make/i)).toHaveValue("");
    expect(screen.getByLabelText(/model/i)).toHaveValue("");
    expect(screen.getByLabelText(/category/i)).toHaveValue("");
    expect(screen.getByLabelText(/minimum price/i)).toHaveValue(null);
    expect(screen.getByLabelText(/maximum price/i)).toHaveValue(null);
  });

  it('shows "No vehicles found" if the search returns an empty array', async () => {
    const user = userEvent.setup();

    axios.get
      .mockResolvedValueOnce({
        data: {
          success: true,
          vehicles: initialVehicles
        }
      })
      .mockResolvedValueOnce({
        data: {
          success: true,
          vehicles: []
        }
      });

    render(<Dashboard />);

    await screen.findByText(/toyota/i);
    await user.click(screen.getByRole("button", { name: /search/i }));

    expect(await screen.findByText(/no vehicles found/i)).toBeInTheDocument();
  });

  it("shows loading while searching", async () => {
    const user = userEvent.setup();

    axios.get
      .mockResolvedValueOnce({
        data: {
          success: true,
          vehicles: initialVehicles
        }
      })
      .mockReturnValueOnce(new Promise(() => {}));

    render(<Dashboard />);

    await screen.findByText(/toyota/i);
    await user.click(screen.getByRole("button", { name: /search/i }));

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("displays the API error message if search fails", async () => {
    const user = userEvent.setup();

    axios.get
      .mockResolvedValueOnce({
        data: {
          success: true,
          vehicles: initialVehicles
        }
      })
      .mockRejectedValueOnce({
        response: {
          data: {
            message: "Search failed"
          }
        }
      });

    render(<Dashboard />);

    await screen.findByText(/toyota/i);
    await user.click(screen.getByRole("button", { name: /search/i }));

    await waitFor(() => {
      expect(screen.getByText(/search failed/i)).toBeInTheDocument();
    });
  });
});
