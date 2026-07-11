const express = require("express");
const request = require("supertest");
const jwt = require("jsonwebtoken");
const authMiddleware = require("../../middleware/auth.middleware");

process.env.JWT_SECRET = "test-secret";

const createTestApp = () => {
  const app = express();

  app.get("/protected", authMiddleware, (req, res) => {
    res.status(200).json({
      success: true,
      user: req.user
    });
  });

  return app;
};

describe("auth middleware", () => {
  it("should allow access with a valid JWT token", async () => {
    const token = jwt.sign(
      {
        userId: "user-id-1",
        email: "john@example.com",
        role: "USER"
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    const response = await request(createTestApp())
      .get("/protected")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.user).toEqual({
      userId: "user-id-1",
      email: "john@example.com",
      role: "USER"
    });
  });

  it("should reject requests without an Authorization header", async () => {
    const response = await request(createTestApp()).get("/protected");

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Access token is required");
  });

  it("should reject malformed JWT tokens", async () => {
    const response = await request(createTestApp())
      .get("/protected")
      .set("Authorization", "Bearer malformed.token");

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Invalid token");
  });

  it("should reject expired JWT tokens", async () => {
    const expiredToken = jwt.sign(
      {
        userId: "user-id-1",
        email: "john@example.com",
        role: "USER"
      },
      process.env.JWT_SECRET,
      { expiresIn: "-1s" }
    );

    const response = await request(createTestApp())
      .get("/protected")
      .set("Authorization", `Bearer ${expiredToken}`);

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Token expired");
  });
});
