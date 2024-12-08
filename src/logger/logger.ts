import winston from "winston";
import * as _ from "lodash";

const colors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "blue",
};

winston.addColors(colors);

const customFormat = winston.format.printf(
  ({ timestamp, level, message, service, ...meta }) => {
    const metaString =
      meta && Object.keys(meta).length ? JSON.stringify(meta) : "";
    return `${timestamp} ${service}:${level}: ${message} ${metaString}`;
  }
);

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    customFormat,
    winston.format.colorize({ colors: colors }),
    winston.format.timestamp(),
    winston.format.prettyPrint({ colorize: true }),
    winston.format.json({ space: 0 })
  ),
  transports: [new winston.transports.Console({})],
});

export const customLogger = (service: string) => ({
  log: (level: string, message: string, ...meta: any) =>
    logger.log({ level, message, service, meta }),

  info: (message: string, ...meta: any) =>
    logger.log({ level: "info", message, service, meta }),

  warn: (message: string, ...meta: any) =>
    logger.log({ level: "warn", message, service, meta }),

  error: (message: string, ...meta: any) =>
    logger.log({ level: "error", message, service, meta }),

  debug: (message: string, ...meta: any) =>
    logger.log({ level: "debug", message, service, meta }),
});

export default logger;
