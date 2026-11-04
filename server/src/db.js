import mongoose from "mongoose";

let memoryServer;

const LOCAL_URI = "mongodb://127.0.0.1:27017/zamanadil";

export function configuredDatabaseUri() {
  return process.env.MONGO_URI?.trim() || process.env.MONGODB_URI?.trim() || "";
}

export function resolveDatabasePlan() {
  const configured = configuredDatabaseUri();
  const env = process.env.NODE_ENV || "development";
  if (env === "production") {
    if (!configured) {
      return {
        action: "fail",
        reason: "MONGO_URI is required in production. MONGODB_URI is accepted when MONGO_URI is empty. In-memory MongoDB is disabled so saved work cannot disappear on restart.",
      };
    }
    return { action: "uri", uri: configured };
  }
  if (configured) return { action: "uri", uri: configured };
  if (env === "test") return { action: "memory" };
  return { action: "local-then-memory", local: LOCAL_URI };
}

function databaseName(uri) {
  try {
    const parsed = new URL(uri);
    return decodeURIComponent(parsed.pathname.replace(/^\//, "").split("/")[0] || "");
  } catch {
    return "";
  }
}

export function assertTestDatabase(uri) {
  if (process.env.NODE_ENV !== "test") return;
  if (databaseName(uri) === "zamanadil") {
    throw new Error("Refusing to run tests against the zamanadil database.");
  }
}

async function canConnect(uri) {
  const conn = await mongoose.createConnection(uri, {
    serverSelectionTimeoutMS: 1200,
  }).asPromise().catch(() => null);
  if (!conn) return false;
  await conn.close();
  return true;
}

function connectOptions() {
  return {
    serverSelectionTimeoutMS: 8000,
    socketTimeoutMS: 20000,
    maxPoolSize: 10,
  };
}

export async function connectDatabase() {
  const plan = resolveDatabasePlan();
  if (plan.action === "fail") throw new Error(plan.reason);

  if (plan.action === "uri") {
    assertTestDatabase(plan.uri);
    await mongoose.connect(plan.uri, connectOptions());
    const name = databaseName(plan.uri);
    console.log(name ? `MongoDB connected (${name})` : "MongoDB connected");
    return;
  }

  if (plan.action === "local-then-memory" && await canConnect(plan.local)) {
    await mongoose.connect(plan.local, connectOptions());
    console.log("MongoDB connected at localhost:27017");
    return;
  }

  if ((process.env.NODE_ENV || "development") === "production") {
    throw new Error("Refusing to start an in-memory database in production.");
  }

  const { MongoMemoryServer } = await import("mongodb-memory-server");
  memoryServer = await MongoMemoryServer.create({
    instance: { dbName: process.env.NODE_ENV === "test" ? "zamanadil_test" : "zamanadil" },
  });
  const uri = new URL(memoryServer.getUri());
  uri.pathname = `/${process.env.NODE_ENV === "test" ? "zamanadil_test" : "zamanadil"}`;
  assertTestDatabase(uri.toString());
  await mongoose.connect(uri.toString(), connectOptions());
  console.log(process.env.NODE_ENV === "test" ? "Test MongoDB started" : "Development MongoDB started");
}

export async function disconnectDatabase() {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = undefined;
  }
}
