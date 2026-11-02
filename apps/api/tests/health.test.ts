import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { FastifyInstance } from "fastify";
import { buildApp } from "../src/app";

describe("API Health Endpoints", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /health should return 200 OK with timestamp and uptime", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/health",
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.status).toBe("ok");
    expect(body.timestamp).toBeDefined();
    expect(typeof body.uptime).toBe("number");
  });

  it("GET /ready should return a structured readiness status", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/ready",
    });

    // 200 or 503 depending on whether postgres is running locally
    expect([200, 503]).toContain(response.statusCode);
    const body = JSON.parse(response.body);
    expect(["ready", "unavailable"]).toContain(body.status);
    expect(body.services).toBeDefined();
    expect(body.services.database).toBeDefined();
  });
});

