const jwt = require("jsonwebtoken");
const request = require("supertest");

process.env.JWT_SECRET = "test-secret";

const app = require("../../app");

const authHeader = `Bearer ${jwt.sign(
  {
    userId: "user-id-1",
    email: "admin@example.com",
    role: "ADMIN"
  },
  process.env.JWT_SECRET,
  { expiresIn: "1d" }
)}`;

describe("Vehicle CRUD routes", () => {
  it("should create a new vehicle", async () => {
    const response = await request(app)
      .post("/api/vehicles")
      .set("Authorization", authHeader)
      .send({
        make: "Toyota",
        model: "Fortuner",
        category: "SUV",
        price: 4500000,
        quantity: 5
      });

    expect(response.status).toBe(201);
  });

  it("should return all vehicles", async () => {
    const response = await request(app)
      .get("/api/vehicles")
      .set("Authorization", authHeader);

    expect(response.status).toBe(200);
  });

  it("should update vehicle details", async () => {
    const response = await request(app)
      .put("/api/vehicles/vehicle-id-1")
      .set("Authorization", authHeader)
      .send({
        price: 4700000,
        quantity: 6
      });

    expect(response.status).toBe(200);
  });

  it("should delete a vehicle", async () => {
    const response = await request(app)
      .delete("/api/vehicles/vehicle-id-1")
      .set("Authorization", authHeader);

    expect(response.status).toBe(200);
  });
});
