import dotenv from "dotenv";
import path from "path";
import { customLogger } from "../logger/logger";

export const configureEnv = () => {
  const logger = customLogger("configureEnv");
  const envFilePath =
    process.env.NODE_ENV === "production" ? ".env.prod" : ".env.dev";
  logger.info("getting env from file", envFilePath);
  dotenv.config({ path: envFilePath });
};
