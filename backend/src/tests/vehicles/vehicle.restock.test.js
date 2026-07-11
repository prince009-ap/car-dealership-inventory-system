const jwt = require("jsonwebtoken");
const request = require("supertest");

process.env.JWT_SECRET = "test-secret";

const app = require("../../app");

const adminToken = jwt.sign(
  {
    userId: "admin-id-1",
    email: "admin@example.com",
    role: "ADMIN"
  },
  process.env.JWT_SECRET,
  { expiresIn: "1d" }
);

const userToken = jwt.sign(
  {
    userId: "user-id-1",
    email: "user@example.com",
    role: "USER"
  },
  process.env.JWT_SECRET,
  { expiresIn: "1d" }
);

describe("POST /api/vehicles/:id/restock", () => {
  it("should allow admin to restock a vehicle successfully", async () => {
    const response = await request(app)
      .post("/api/vehicles/vehicle-id-1/restock")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ quantity: 5 });

    expect(response.status).toBe(200);
    expect(response.body.quantity).toBe(10);
  });

  it("should reject normal user restock attempts", async () => {
    const response = await request(app)
      .post("/api/vehicles/vehicle-id-1/restock")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ quantity: 5 });

    expect(response.status).toBe(403);
    expect(response.body.message).toBe("Access denied. Admin only.");
  });

  it("should fail when the vehicle is not found", async () => {
    const response = await request(app)
      .post("/api/vehicles/missing-id/restock")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ quantity: 5 });

    expect(response.status).toBe(404);
  });

  it("should require a restock quantity greater than 0", async () => {
    const response = await request(app)
      .post("/api/vehicles/vehicle-id-1/restock")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ quantity: 0 });

    expect(response.status).toBe(400);
  });

  it("should require JWT authentication", async () => {
    const response = await request(app)
      .post("/api/vehicles/vehicle-id-1/restock")
      .send({ quantity: 5 });

    expect(response.status).toBe(401);
  });

  it("should keep quantity unchanged if the request fails", async () => {
    const response = await request(app)
      .post("/api/vehicles/vehicle-id-1/restock")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ quantity: 5 });

    expect(response.status).toBe(403);
    expect(response.body.quantity).toBe(5);
  });
});
