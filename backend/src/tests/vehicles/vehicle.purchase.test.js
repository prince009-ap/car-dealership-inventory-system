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

describe("POST /api/vehicles/:id/purchase", () => {
  it("should purchase a vehicle successfully", async () => {
    const response = await request(app)
      .post("/api/vehicles/vehicle-id-1/purchase")
      .set("Authorization", authHeader);

    expect(response.status).toBe(200);
    expect(response.body.quantity).toBe(4);
  });

  it("should fail when quantity is already 0", async () => {
    const response = await request(app)
      .post("/api/vehicles/out-of-stock-id/purchase")
      .set("Authorization", authHeader);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Vehicle is out of stock");
  });

  it("should fail if vehicle does not exist", async () => {
    const response = await request(app)
      .post("/api/vehicles/missing-id/purchase")
      .set("Authorization", authHeader);

    expect(response.status).toBe(404);
  });

  it("should require JWT authentication", async () => {
    const response = await request(app).post("/api/vehicles/vehicle-id-1/purchase");

    expect(response.status).toBe(401);
  });

  it("should keep quantity unchanged if purchase fails", async () => {
    const response = await request(app)
      .post("/api/vehicles/out-of-stock-id/purchase")
      .set("Authorization", authHeader);

    expect(response.status).toBe(400);
    expect(response.body.quantity).toBe(0);
  });
});
