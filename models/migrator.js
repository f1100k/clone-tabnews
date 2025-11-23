import migrationRunner from "node-pg-migrate";
import path from "path";
import database from "infra/database";

const defaultMigrationOptions = {
  dir: path.resolve("infra", "migrations"),
  migrationsTable: "pgmigrations",
  direction: "up",
  log: () => {},
};

async function listPendingMigrations() {
  let dbClient;

  try {
    dbClient = await database.getNewClient();

    return await migrationRunner({
      ...defaultMigrationOptions,
      dbClient,
      dryRun: true,
    });
  } finally {
    dbClient?.end();
  }
}

async function runPendingMigrations() {
  let dbClient;

  try {
    dbClient = await database.getNewClient();

    return await migrationRunner({
      ...defaultMigrationOptions,
      dbClient,
    });
  } finally {
    dbClient?.end();
  }
}

const migrator = {
  listPendingMigrations,
  runPendingMigrations,
};

export default migrator;
