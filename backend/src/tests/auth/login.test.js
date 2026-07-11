const request = require("supertest");

jest.mock("../../models/User", () => ({
  findOne: jest.fn()
}));

jest.mock("bcryptjs", () => ({
  compare: jest.fn(),
  hash: jest.fn()
}));

jest.mock("jsonwebtoken", () => ({
  sign: jest.fn()
}));

const app = require("../../app");
const User = require("../../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

process.env.JWT_SECRET = "test-secret";

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should login successfully with valid email and password", async () => {
    User.findOne.mockResolvedValue({
      _id: "user-id-1",
      name: "John Doe",
      email: "john@example.com",
      password: "hashed-password",
      role: "USER"
    });
    bcrypt.compare.mockResolvedValue(true);
    jwt.sign.mockReturnValue("jwt-token");

    const response = await request(app).post("/api/auth/login").send({
      email: "john@example.com",
      password: "secret123"
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Login successful");
    expect(response.body.token).toBe("jwt-token");
    expect(response.body.user.id).toBe("user-id-1");
    expect(response.body.user.role).toBe("USER");
    expect(jwt.sign).toHaveBeenCalledWith(
      {
        userId: "user-id-1",
        email: "john@example.com",
        role: "USER"
      },
      expect.any(String),
      { expiresIn: "1d" }
    );
  });

  it("should fail if email does not exist", async () => {
    User.findOne.mockResolvedValue(null);

    const response = await request(app).post("/api/auth/login").send({
      email: "missing@example.com",
      password: "secret123"
    });

    expect(response.status).toBe(404);
  });

  it("should fail if password is incorrect", async () => {
    User.findOne.mockResolvedValue({
      _id: "user-id-1",
      name: "John Doe",
      email: "john@example.com",
      password: "hashed-password",
      role: "USER"
    });
    bcrypt.compare.mockResolvedValue(false);

    const response = await request(app).post("/api/auth/login").send({
      email: "john@example.com",
      password: "wrong-password"
    });

    expect(response.status).toBe(401);
  });

  it("should fail if email is missing", async () => {
    const response = await request(app).post("/api/auth/login").send({
      password: "secret123"
    });

    expect(response.status).toBe(400);
  });

  it("should fail if password is missing", async () => {
    const response = await request(app).post("/api/auth/login").send({
      email: "john@example.com"
    });

    expect(response.status).toBe(400);
  });
});
