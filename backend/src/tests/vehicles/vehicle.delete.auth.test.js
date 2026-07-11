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

describe("DELETE /api/vehicles/:id authorization", () => {
  it("should allow ADMIN user to delete a vehicle", async () => {
    const response = await request(app)
      .delete("/api/vehicles/vehicle-id-1")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
  });

  it("should reject USER from deleting a vehicle", async () => {
    const response = await request(app)
      .delete("/api/vehicles/vehicle-id-1")
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(403);
    expect(response.body.message).toBe("Access denied. Admin only.");
  });

  it("should reject delete requests without JWT", async () => {
    const response = await request(app).delete("/api/vehicles/vehicle-id-1");

    expect(response.status).toBe(401);
  });

  it("should reject delete requests with invalid JWT", async () => {
    const response = await request(app)
      .delete("/api/vehicles/vehicle-id-1")
      .set("Authorization", "Bearer invalid.token.here");

    expect(response.status).toBe(401);
  });
});
