const request = require("supertest");
const app = require("../app");

describe("GET /api/health", () => {
  it("should return server health status", async () => {
    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      message: "Server Running"
    });
  });
});
