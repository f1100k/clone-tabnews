import database from "infra/database.js";
import { ValidationError, NotFoundError } from "infra/errors.js";
import passowrd from "models/password.js";

async function findOneByUsername(username) {
  const foundUser = await runSelectQuery(username);
  return foundUser;

  async function runSelectQuery(username) {
    const result = await database.query({
      text: "select * from users where lower(username) = lower($1) limit 1;",
      values: [username],
    });

    if (result.rowCount === 0) {
      throw new NotFoundError({
        message: `Não foi possível encontrar usuário com o username: ${username}.`,
        action: "Forneça um username existente.",
      });
    }

    return result.rows[0];
  }
}

async function create(userInputValues) {
  validateMissingFields(userInputValues);
  await validateUniqueUser(userInputValues);
  await passowrd.hashPasswordInObject(userInputValues);

  return await runInsertQuery(userInputValues);

  async function runInsertQuery(userInputValues) {
    const result = await database.query({
      text: "insert into users (username, email, password) values ($1, $2, $3) returning *;",
      values: [
        userInputValues.username,
        userInputValues.email,
        userInputValues.password,
      ],
    });

    return result.rows[0];
  }

  async function validateUniqueUser(userInputValues) {
    const result = await database.query({
      text: "select * from users where lower(email) = lower($1) OR lower(username) = lower($2)",
      values: [userInputValues.email, userInputValues.username],
    });

    if (result.rows.length > 0) {
      throw new ValidationError({
        message: "Já foi cadastrado um usuário com esse username ou email.",
        action: "Utilize outro email ou username.",
      });
    }
  }

  function validateMissingFields(userInputValues) {
    if (
      !userInputValues?.email ||
      !userInputValues?.username ||
      !userInputValues?.password
    ) {
      throw new ValidationError({
        action:
          "Preencha corretamente os campos 'username', 'email' e 'password'",
      });
    }
  }
}

const user = {
  create,
  findOneByUsername,
};

export default user;
