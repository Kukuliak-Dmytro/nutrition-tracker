#!/usr/bin/env ts-node
import { execSync } from "child_process";
import { existsSync, writeFileSync, readdirSync } from "fs";

const CONTAINER_NAME = "nutrition-tracker-db";

function checkDockerInstalled(): boolean {
  try {
    execSync("docker --version", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function checkDockerComposeInstalled(): boolean {
  try {
    execSync("docker compose version", { stdio: "ignore" });
    return true;
  } catch {
    try {
      execSync("docker-compose --version", { stdio: "ignore" });
      return true;
    } catch {
      return false;
    }
  }
}

function isContainerRunning(): boolean {
  try {
    const output = execSync(
      `docker ps --filter "name=${CONTAINER_NAME}" --format "{{.Names}}"`,
      { encoding: "utf-8", stdio: "pipe" }
    );
    return output.trim() === CONTAINER_NAME;
  } catch {
    return false;
  }
}

function isContainerExists(): boolean {
  try {
    const output = execSync(
      `docker ps -a --filter "name=${CONTAINER_NAME}" --format "{{.Names}}"`,
      { encoding: "utf-8", stdio: "pipe" }
    );
    return output.trim() === CONTAINER_NAME;
  } catch {
    return false;
  }
}

function waitForDatabase(maxAttempts = 30, delay = 1000): Promise<void> {
  return new Promise((resolve, reject) => {
    let attempts = 0;

    const checkConnection = () => {
      attempts++;
      try {
        execSync(
          `docker exec ${CONTAINER_NAME} pg_isready -U nutrition_user -d nutrition_tracker`,
          { stdio: "ignore" }
        );
        console.log("✓ Database is ready");
        resolve();
      } catch (error) {
        if (attempts >= maxAttempts) {
          reject(
            new Error("Database failed to become ready after maximum attempts")
          );
        } else {
          process.stdout.write(".");
          setTimeout(checkConnection, delay);
        }
      }
    };

    checkConnection();
  });
}

function startContainer(): void {
  console.log("Starting PostgreSQL container...");
  try {
    // Try docker compose first (newer syntax)
    try {
      execSync("docker compose up -d", { stdio: "inherit" });
    } catch {
      // Fallback to docker-compose (older syntax)
      execSync("docker-compose up -d", { stdio: "inherit" });
    }
    console.log("✓ Container started");
  } catch (error) {
    throw new Error(`Failed to start container: ${error}`);
  }
}

function runMigrations(): void {
  console.log("Setting up database schema...");

  // Check if migrations directory exists
  const migrationsDir = "prisma/migrations";
  const hasMigrations =
    existsSync(migrationsDir) && readdirSync(migrationsDir).length > 0;

  try {
    if (hasMigrations) {
      // If migrations exist, use migrate deploy
      console.log("Found existing migrations, applying them...");
      execSync("npx prisma migrate deploy", { stdio: "inherit" });
      console.log("✓ Migrations applied");
    } else {
      // If no migrations exist, push schema directly (better for local dev)
      console.log("No migrations found, pushing schema directly...");
      execSync("npx prisma db push --accept-data-loss", { stdio: "inherit" });
      console.log("✓ Schema pushed to database");
    }
  } catch (error) {
    // If migrate deploy fails, try db push as fallback
    if (hasMigrations) {
      console.log("Migration deploy failed, trying db push as fallback...");
      try {
        execSync("npx prisma db push --accept-data-loss", { stdio: "inherit" });
        console.log("✓ Schema pushed to database");
      } catch (fallbackError) {
        throw new Error(`Database setup failed: ${fallbackError}`);
      }
    } else {
      throw new Error(`Database setup failed: ${error}`);
    }
  }
}

function generatePrismaClient(): void {
  console.log("Generating Prisma Client...");
  try {
    execSync("npx prisma generate", { stdio: "inherit" });
    console.log("✓ Prisma Client generated");
  } catch (error) {
    throw new Error(`Failed to generate Prisma Client: ${error}`);
  }
}

async function main() {
  console.log("🔍 Checking Docker setup...");

  if (!checkDockerInstalled()) {
    console.error("❌ Docker is not installed. Please install Docker Desktop.");
    process.exit(1);
  }

  if (!checkDockerComposeInstalled()) {
    console.error(
      "❌ Docker Compose is not installed. Please install Docker Compose."
    );
    process.exit(1);
  }

  console.log("✓ Docker and Docker Compose are available");

  // Check if container exists and is running
  const containerRunning = isContainerRunning();
  const containerExists = isContainerExists();

  if (!containerRunning) {
    if (containerExists) {
      console.log("Container exists but is not running. Starting it...");
      try {
        execSync(`docker start ${CONTAINER_NAME}`, { stdio: "inherit" });
        console.log("✓ Container started");
      } catch (error) {
        console.error(
          "Failed to start existing container. Creating new one..."
        );
        startContainer();
      }
    } else {
      console.log("No container found. Creating new PostgreSQL container...");
      startContainer();
    }

    console.log("Waiting for database to be ready");
    await waitForDatabase();
  } else {
    console.log("✓ PostgreSQL container is already running");
  }

  // Check if .env file exists, create it if not
  if (!existsSync(".env")) {
    console.log("Creating .env file from template...");
    const envContent = `# Database
DATABASE_URL="postgresql://nutrition_user:nutrition_password@localhost:5432/nutrition_tracker?schema=public"
DIRECT_URL="postgresql://nutrition_user:nutrition_password@localhost:5432/nutrition_tracker?schema=public"

# Supabase (optional for local development)
NEXT_PUBLIC_SUPABASE_URL=""
NEXT_PUBLIC_SUPABASE_ANON_KEY=""

# Google Generative AI (optional)
GOOGLE_GENERATIVE_AI_API_KEY=""
`;
    writeFileSync(".env", envContent);
    console.log("✓ .env file created");
  }

  // Run migrations
  runMigrations();

  // Generate Prisma Client
  generatePrismaClient();

  console.log("\n✅ Database setup complete!");
  console.log("You can now run: npm run dev");
}

main().catch((error) => {
  console.error("❌ Setup failed:", error.message);
  process.exit(1);
});
