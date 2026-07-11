import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import Dashboard from "../pages/Dashboard";
import axios from "axios";

const requestInterceptor = vi.hoisted(() => ({ current: null }));

vi.mock("axios", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: {
        use: vi.fn((callback) => {
          requestInterceptor.current = callback;
          return 1;
        })
      }
    }
  }
}));

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
    quantity: 1
  }
];

const setSession = (role = "ADMIN") => {
  localStorage.setItem("token", "mock-jwt-token");
  localStorage.setItem("user", JSON.stringify({ role }));
};

const renderDashboard = (role = "ADMIN") => {
  setSession(role);

  axios.get.mockResolvedValueOnce({
    data: {
      success: true,
      vehicles
    }
  });

  render(<Dashboard />);
};

describe("Admin Inventory Management", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requestInterceptor.current = null;
    localStorage.clear();
  });

  it("lets an admin open the Add Vehicle modal", async () => {
    renderDashboard("ADMIN");

    const addVehicleButton = await screen.findByRole("button", { name: /add vehicle/i });
    await userEvent.click(addVehicleButton);

    expect(screen.getByRole("dialog", { name: /add vehicle/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/make/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/model/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/price/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/quantity/i)).toBeInTheDocument();
  });

  it("lets an admin create a vehicle", async () => {
    renderDashboard("ADMIN");

    const addVehicleButton = await screen.findByRole("button", { name: /add vehicle/i });
    await userEvent.click(addVehicleButton);

    await userEvent.type(screen.getByLabelText(/make/i), "Honda");
    await userEvent.type(screen.getByLabelText(/model/i), "City");
    await userEvent.selectOptions(screen.getByLabelText(/category/i), "Sedan");
    await userEvent.type(screen.getByLabelText(/price/i), "2500000");
    await userEvent.type(screen.getByLabelText(/quantity/i), "4");
    await userEvent.click(screen.getByRole("button", { name: /create vehicle/i }));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        "/vehicles",
        expect.objectContaining({
          make: "Honda",
          model: "City",
          category: "Sedan",
          price: 2500000,
          quantity: 4
        }),
        expect.any(Object)
      );
    });
  });

  it("shows validation messages when the create form is submitted empty", async () => {
    renderDashboard("ADMIN");

    await userEvent.click(await screen.findByRole("button", { name: /add vehicle/i }));
    await userEvent.click(screen.getByRole("button", { name: /create vehicle/i }));

    expect(screen.getByText(/make is required/i)).toBeInTheDocument();
    expect(screen.getByText(/model is required/i)).toBeInTheDocument();
    expect(screen.getByText(/category is required/i)).toBeInTheDocument();
    expect(screen.getByText(/price is required/i)).toBeInTheDocument();
    expect(screen.getByText(/quantity is required/i)).toBeInTheDocument();
  });

  it("lets an admin edit a vehicle and shows existing values in the form", async () => {
    renderDashboard("ADMIN");

    await screen.findByText(/toyota/i);
    await userEvent.click(await screen.findByRole("button", { name: /edit/i }));

    expect(screen.getByRole("dialog", { name: /edit vehicle/i })).toBeInTheDocument();
    expect(screen.getByDisplayValue("Toyota")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Fortuner")).toBeInTheDocument();
    expect(screen.getByDisplayValue("SUV")).toBeInTheDocument();
    expect(screen.getByDisplayValue("4500000")).toBeInTheDocument();
    expect(screen.getByDisplayValue("3")).toBeInTheDocument();
  });

  it("lets an admin delete a vehicle after confirmation", async () => {
    renderDashboard("ADMIN");

    await userEvent.click(await screen.findByRole("button", { name: /delete/i }));

    expect(screen.getByRole("dialog", { name: /delete vehicle/i })).toBeInTheDocument();
    expect(screen.getByText(/are you sure you want to delete this vehicle/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /confirm delete/i }));

    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalledWith("/vehicles/vehicle-1", expect.any(Object));
    });
  });

  it("lets an admin restock a vehicle and updates the quantity", async () => {
    renderDashboard("ADMIN");

    await userEvent.click(await screen.findByRole("button", { name: /restock/i }));

    expect(screen.getByRole("dialog", { name: /restock vehicle/i })).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText(/quantity/i), "2");
    await userEvent.click(screen.getByRole("button", { name: /restock vehicle/i }));

    expect(screen.getByText(/5/i)).toBeInTheDocument();
  });

  it("never shows admin actions to non-admin users", async () => {
    renderDashboard("USER");

    expect(screen.queryByRole("button", { name: /add vehicle/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /edit/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /delete/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /restock/i })).not.toBeInTheDocument();

    localStorage.clear();
    renderDashboard("ADMIN");

    expect(await screen.findByRole("button", { name: /add vehicle/i })).toBeInTheDocument();
  });

  it("displays backend errors during admin actions", async () => {
    axios.post.mockRejectedValueOnce({
      response: {
        data: {
          message: "Vehicle creation failed"
        }
      }
    });

    renderDashboard("ADMIN");

    await userEvent.click(await screen.findByRole("button", { name: /add vehicle/i }));
    await userEvent.click(screen.getByRole("button", { name: /create vehicle/i }));

    expect(screen.getByText(/vehicle creation failed/i)).toBeInTheDocument();
  });

  it("shows a loading state while admin API calls are in progress", async () => {
    let resolveRequest;

    axios.post.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveRequest = resolve;
        })
    );

    renderDashboard("ADMIN");

    await userEvent.click(await screen.findByRole("button", { name: /add vehicle/i }));
    await userEvent.click(screen.getByRole("button", { name: /create vehicle/i }));

    expect(screen.getByRole("button", { name: /creating/i })).toBeDisabled();
    expect(screen.getByText(/loading/i)).toBeInTheDocument();

    resolveRequest({
      data: {
        success: true
      }
    });
  });
});
