const request = require("supertest");
const app = require("../../app");
const authService = require("../../services/auth.service");

jest.mock("../../services/auth.service");

describe("POST /api/auth/register", () => {
  it("should register a new user successfully", async () => {
    authService.registerUser.mockResolvedValue({
      _id: "user-id-1",
      name: "John Doe",
      email: "john@example.com",
      role: "USER",
      createdAt: "2026-07-11T00:00:00.000Z",
      updatedAt: "2026-07-11T00:00:00.000Z"
    });

    const response = await request(app).post("/api/auth/register").send({
      name: "John Doe",
      email: "john@example.com",
      password: "secret123"
    });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.user).toBeDefined();
    expect(response.body.user.password).toBeUndefined();
  });

  it("should fail if name is missing", async () => {
    authService.registerUser.mockRejectedValue({
      message: "Name is required",
      statusCode: 400
    });

    const response = await request(app).post("/api/auth/register").send({
      email: "john@example.com",
      password: "secret123"
    });

    expect(response.status).toBe(400);
  });

  it("should fail if email is missing", async () => {
    authService.registerUser.mockRejectedValue({
      message: "Email is required",
      statusCode: 400
    });

    const response = await request(app).post("/api/auth/register").send({
      name: "John Doe",
      password: "secret123"
    });

    expect(response.status).toBe(400);
  });

  it("should fail if password is shorter than 6 characters", async () => {
    authService.registerUser.mockRejectedValue({
      message: "Password must be at least 6 characters long",
      statusCode: 400
    });

    const response = await request(app).post("/api/auth/register").send({
      name: "John Doe",
      email: "john@example.com",
      password: "123"
    });

    expect(response.status).toBe(400);
  });

  it("should fail if email already exists", async () => {
    authService.registerUser.mockRejectedValue({
      message: "Email already exists",
      statusCode: 409
    });

    const response = await request(app).post("/api/auth/register").send({
      name: "John Doe",
      email: "john@example.com",
      password: "secret123"
    });

    expect(response.status).toBe(409);
  });
});
