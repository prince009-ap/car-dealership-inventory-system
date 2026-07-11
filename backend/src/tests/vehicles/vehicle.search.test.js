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

describe("GET /api/vehicles/search", () => {
  it("should search vehicles by make", async () => {
    const response = await request(app)
      .get("/api/vehicles/search?make=Toyota")
      .set("Authorization", authHeader);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.every((vehicle) => vehicle.make === "Toyota")).toBe(true);
  });

  it("should search vehicles by model", async () => {
    const response = await request(app)
      .get("/api/vehicles/search?model=Fortuner")
      .set("Authorization", authHeader);

    expect(response.status).toBe(200);
  });

  it("should search vehicles by category", async () => {
    const response = await request(app)
      .get("/api/vehicles/search?category=SUV")
      .set("Authorization", authHeader);

    expect(response.status).toBe(200);
  });

  it("should search vehicles by minimum and maximum price", async () => {
    const response = await request(app)
      .get("/api/vehicles/search?minPrice=1000000&maxPrice=5000000")
      .set("Authorization", authHeader);

    expect(response.status).toBe(200);
  });

  it("should return an empty array when no vehicles match", async () => {
    const response = await request(app)
      .get("/api/vehicles/search?make=DoesNotExist")
      .set("Authorization", authHeader);

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });
});
