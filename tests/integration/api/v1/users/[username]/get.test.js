import orchestrator from "tests/orchestrator.js";
import { version as uuidVersion } from "uuid";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.cleanDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET api/v1/users/[username]", () => {
  describe("Anonymous user", () => {
    test("With exact case match", async () => {
      await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "JohnDoe",
          email: "johndoe@email.com",
          password: "password123",
        }),
      });

      const response2 = await fetch(
        "http://localhost:3000/api/v1/users/JohnDoe",
      );

      expect(response2.status).toBe(200);

      const responseBody = await response2.json();

      expect(responseBody).toEqual({
        id: responseBody.id,
        username: "JohnDoe",
        email: "johndoe@email.com",
        password: responseBody.password,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
    });

    test("With mismatch", async () => {
      await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "JohnDoe",
          email: "johndoe@email.com",
          password: "password123",
        }),
      });

      const response2 = await fetch(
        "http://localhost:3000/api/v1/users/johndoe",
      );

      expect(response2.status).toBe(200);

      const responseBody = await response2.json();

      expect(responseBody).toEqual({
        id: responseBody.id,
        username: "JohnDoe",
        email: "johndoe@email.com",
        password: responseBody.password,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
    });

    test("With noexistent username", async () => {
      const response = await fetch("http://localhost:3000/api/v1/users/john");

      expect(response.status).toBe(404);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "NotFoundError",
        message: "Não foi possível encontrar usuário com o username: john.",
        action: "Forneça um username existente.",
        status_code: 404,
      });
    });
  });
});
