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
      const validUser = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "johndoe",
          email: "johndoe@email.com",
          password: "password123",
        }),
      });

      expect(validUser.status).toBe(201);

      const response = await fetch(
        "http://localhost:3000/api/v1/users/nonExistentUser",
        {
          method: "PATCH",
        },
      );

      expect(response.status).toBe(404);
    });

    test("With duplicated 'email'", async () => {
      const validUser = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "validuser",
          email: "validuser@email.com",
          password: "password123",
        }),
      });

      expect(validUser.status).toBe(201);

      const validUser2 = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "validuser2",
          email: "validuser2@email.com",
          password: "password123",
        }),
      });

      expect(validUser2.status).toBe(201);

      const response = await fetch(
        "http://localhost:3000/api/v1/users/validuser2",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: "validuser@email.com",
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
      const validUser3 = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "validuser3",
          email: "validuser3@email.com",
          password: "password123",
        }),
      });

      expect(validUser3.status).toBe(201);

      const validUser4 = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "validuser4",
          email: "validuser4@email.com",
          password: "password123",
        }),
      });

      expect(validUser4.status).toBe(201);

      const response = await fetch(
        "http://localhost:3000/api/v1/users/validuser4",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: "validuser3",
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
      const validUser3 = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "validusername",
          email: "validusername@email.com",
          password: "password123",
        }),
      });

      expect(validUser3.status).toBe(201);

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
        email: "validusername@email.com",
        password: responseBody.password,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      expect("password123" !== responseBody.password).toBeTruthy();

      const correctPasswordMatch = await password.compare(
        "password123",
        responseBody.password,
      );

      expect(correctPasswordMatch).toBeTruthy();

      const incorrectPasswordMatch = await password.compare(
        "word123",
        responseBody.password,
      );

      expect(incorrectPasswordMatch).toBeFalsy();

      expect(responseBody.created_at < responseBody.updated_at).toBeTruthy();
    });

    test("With valid 'email'", async () => {
      const validUser3 = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "validemail",
          email: "validemail@email.com",
          password: "password123",
        }),
      });

      expect(validUser3.status).toBe(201);

      const response = await fetch(
        "http://localhost:3000/api/v1/users/validemail",
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
        username: "validemail",
        email: "newvalidemail@email.com",
        password: responseBody.password,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      expect("password123" !== responseBody.password).toBeTruthy();

      const correctPasswordMatch = await password.compare(
        "password123",
        responseBody.password,
      );

      expect(correctPasswordMatch).toBeTruthy();

      const incorrectPasswordMatch = await password.compare(
        "word123",
        responseBody.password,
      );

      expect(incorrectPasswordMatch).toBeFalsy();

      expect(responseBody.created_at < responseBody.updated_at).toBeTruthy();
    });
    test("With valid 'password'", async () => {
      const validUser3 = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "validpassword",
          email: "validpassword@email.com",
          password: "password123",
        }),
      });

      expect(validUser3.status).toBe(201);

      const response = await fetch(
        "http://localhost:3000/api/v1/users/validpassword",
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

      expect(responseBody).toEqual({
        id: responseBody.id,
        username: "validpassword",
        email: "validpassword@email.com",
        password: responseBody.password,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

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
