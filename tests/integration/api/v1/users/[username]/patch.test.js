import orchestrator from "tests/orchestrator.js";
import { version as uuidVersion } from "uuid";
import password from "models/password.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.cleanDatabase();
  await orchestrator.runPendingMigrations();
});

describe("PATCH api/v1/users/[username]", () => {
  describe("Anonymous user", () => {
    test("With nonexistent user", async () => {
      const response = await fetch(
        "http://localhost:3000/api/v1/users/nonExistentUser",
        {
          method: "PATCH",
        },
      );

      expect(response.status).toBe(404);
    });

    test("With duplicated 'email'", async () => {
      await orchestrator.createUser({
        email: "validemail1@email.com",
      });

      const user = await orchestrator.createUser({
        email: "validemail2@email.com",
      });

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${user.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: "validemail1@email.com",
          }),
        },
      );

      expect(response.status).toBe(400);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        message: "O email informado já foi utilizado.",
        action: "Utilize outro email para realizar essa operação.",
        name: "ValidationError",
        status_code: 400,
      });
    });

    test("With duplicated 'username'", async () => {
      await orchestrator.createUser({
        username: "jonjon",
      });

      await orchestrator.createUser({
        username: "nonnon",
      });

      const response = await fetch(
        "http://localhost:3000/api/v1/users/nonnon",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: "jonjon",
          }),
        },
      );

      expect(response.status).toBe(400);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        message: "O username informado já foi utilizado.",
        action: "Utilize outro username para realizar essa operação.",
        name: "ValidationError",
        status_code: 400,
      });
    });

    test("With valid 'username'", async () => {
      await orchestrator.createUser({
        username: "validusername",
      });

      const response = await fetch(
        "http://localhost:3000/api/v1/users/validusername",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: "newvalidusername",
          }),
        },
      );

      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: responseBody.id,
        username: "newvalidusername",
        email: responseBody.email,
        password: responseBody.password,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      expect(responseBody.created_at < responseBody.updated_at).toBeTruthy();
    });

    test("With valid 'email'", async () => {
      const user = await orchestrator.createUser({
        email: "validemail@email.com",
      });

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${user.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: "newvalidemail@email.com",
          }),
        },
      );

      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: responseBody.id,
        username: responseBody.username,
        email: "newvalidemail@email.com",
        password: responseBody.password,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      expect(responseBody.created_at < responseBody.updated_at).toBeTruthy();
    });

    test("With valid 'password'", async () => {
      const user = await orchestrator.createUser();

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${user.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            password: "newpassword123",
          }),
        },
      );

      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      expect("newpassword123" !== responseBody.password).toBeTruthy();

      const correctPasswordMatch = await password.compare(
        "newpassword123",
        responseBody.password,
      );

      expect(correctPasswordMatch).toBeTruthy();

      const incorrectPasswordMatch = await password.compare(
        "password123",
        responseBody.password,
      );

      expect(incorrectPasswordMatch).toBeFalsy();

      expect(responseBody.created_at < responseBody.updated_at).toBeTruthy();
    });
  });
});
