import retry from "async-retry";
import { faker } from "@faker-js/faker";

import database from "infra/database.js";
import migrator from "models/migrator.js";
import user from "models/user";
import sessions from "models/sessions";

const EMAIL_HTTP_URL = `http://${process.env.EMAIL_HTTP_HOST}:${process.env.EMAIL_HTTP_PORT}`;

async function waitForAllServices() {
  await waitForWebServer();
  await waitForEmailServer();

  async function waitForWebServer() {
    return retry(fetchStatusPage, {
      retries: 100,
      maxTimeout: 1000,
    });

    async function fetchStatusPage() {
      const response = await fetch("http://localhost:3000/api/v1/status");

      if (response.status !== 200) throw Error();
    }
  }

  async function waitForEmailServer() {
    return retry(fetchEmailServer, {
      retries: 100,
      maxTimeout: 1000,
    });

    async function fetchEmailServer() {
      const response = await fetch(EMAIL_HTTP_URL);

      if (response.status !== 200) throw Error();
    }
  }
}

async function cleanDatabase() {
  await database.query("drop schema public cascade; create schema public;");
}

async function runPendingMigrations() {
  await migrator.runPendingMigrations();
}

async function createUser(userInputValues = {}) {
  return await user.create({
    username:
      userInputValues.username ||
      faker.internet.username().replace(/[_.-]/g, ""),
    email: userInputValues.email || faker.internet.email(),
    password: userInputValues.password || "validpassword",
  });
}

async function createSession(userId) {
  return await sessions.create(userId);
}

async function clearAllEmails() {
  await fetch(
    `http://${process.env.EMAIL_HTTP_HOST}:${process.env.EMAIL_HTTP_PORT}/messages`,
    {
      method: "DELETE",
    },
  );
}

async function getLastEmail() {
  const getAllEmails = await fetch(`${EMAIL_HTTP_URL}/messages`, {
    method: "GET",
  });
  const messages = await getAllEmails.json();
  const lastEmail = messages.pop();
  const lastEmailBody = await fetch(
    `${EMAIL_HTTP_URL}/messages/${lastEmail.id}.plain`,
    {
      method: "GET",
    },
  );
  const lastEmailText = await lastEmailBody.text();
  lastEmail.text = lastEmailText;
  return lastEmail;
}

const orchestrator = {
  waitForAllServices,
  cleanDatabase,
  runPendingMigrations,
  createUser,
  createSession,
  clearAllEmails,
  getLastEmail,
};

export default orchestrator;
