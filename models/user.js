import database from "infra/database.js";
import { ValidationError, NotFoundError } from "infra/errors.js";
import password from "models/password.js";

async function findOneByEmail(email) {
  return await runSelectQuery(email);

  async function runSelectQuery(email) {
    const result = await database.query({
      text: "select * from users where lower(email) = lower($1) limit 1;",
      values: [email],
    });

    if (result.rowCount === 0) {
      throw new NotFoundError({
        message: `Não foi possível encontrar usuário com o email: ${email}.`,
        action: "Forneça um email existente.",
      });
    }

    return result.rows[0];
  }
}

async function findOneByUsername(username) {
  return await runSelectQuery(username);

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
  await validateUniqueEmail(userInputValues);
  await password.hashPasswordInObject(userInputValues);

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
}

async function update(username, userInputValues) {
  const foundUser = await findOneByUsername(username);

  if ("username" in userInputValues) {
    if (userInputValues.username !== foundUser.username) {
      await validateUniqueUsername(userInputValues);
    }
  }

  if ("email" in userInputValues) {
    await validateUniqueEmail(userInputValues);
  }

  if ("password" in userInputValues) {
    await password.hashPasswordInObject(userInputValues);
  }

  const newUserValues = { ...foundUser, ...userInputValues };

  const updatedUser = await runUpdateQuery(newUserValues);

  return updatedUser;
}

async function runUpdateQuery(userWithNewValues) {
  const result = await database.query({
    text: `
      UPDATE
        users
      SET
        username = $2,
        email = $3,
        password = $4,
        updated_at = timezone('utc', now())
      WHERE id = $1
      RETURNING *;
    `,
    values: [
      userWithNewValues.id,
      userWithNewValues.username,
      userWithNewValues.email,
      userWithNewValues.password,
    ],
  });

  return result.rows[0];
}

async function validateUniqueEmail(userInputValues) {
  const result = await database.query({
    text: "select * from users where lower(email) = lower($1);",
    values: [userInputValues.email],
  });

  if (result.rows.length > 0) {
    throw new ValidationError({
      message: "O email informado já foi utilizado.",
      action: "Utilize outro email para realizar essa operação.",
    });
  }
}

async function validateUniqueUsername(userInputValues) {
  const result = await database.query({
    text: "select * from users where lower(username) = lower($1);",
    values: [userInputValues.username],
  });

  if (result.rows.length > 0) {
    throw new ValidationError({
      message: "O username informado já foi utilizado.",
      action: "Utilize outro username para realizar essa operação.",
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

const user = {
  create,
  update,
  findOneByUsername,
  findOneByEmail,
};

export default user;
