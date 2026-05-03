import "./config/env";
import app from "./app";
import { env } from "./config/env";
import { logError, logInfo } from "./utils/log";

const server = app.listen(env.PORT, () => {
  logInfo("Server started", { port: env.PORT, nodeEnv: env.NODE_ENV });
});

server.on("error", (error) => {
  logError("Server failed", { error });
});
