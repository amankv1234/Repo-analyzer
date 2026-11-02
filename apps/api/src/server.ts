import { buildApp } from "./app";
import { env } from "@repomentor/shared";

const app = buildApp();

async function start() {
  try {
    await app.listen({
      port: env.PORT,
      host: env.HOST,
    });
    app.log.info(`🚀 RepoMentor API listening on http://${env.HOST}:${env.PORT}`);
    app.log.info(`📚 Swagger OpenAPI documentation available at http://${env.HOST}:${env.PORT}/docs`);
  } catch (err) {
    app.log.fatal(err, "Failed to start API server");
    process.exit(1);
  }
}

// Handle graceful termination
const signals: NodeJS.Signals[] = ["SIGINT", "SIGTERM"];
for (const signal of signals) {
  process.on(signal, async () => {
    app.log.info({ signal }, "Received shutdown signal. Gracefully closing Fastify server...");
    try {
      await app.close();
      app.log.info("Server closed successfully.");
      process.exit(0);
    } catch (err) {
      app.log.error(err, "Error while closing server");
      process.exit(1);
    }
  });
}

start();

