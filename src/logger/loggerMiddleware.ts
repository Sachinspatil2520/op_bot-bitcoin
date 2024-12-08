import { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";
import logger from "./logger";

export const correlationIdMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let correlationId = req.headers["x-correlation-id"];

  if (!correlationId) {
    correlationId = uuidv4();
    if (!correlationId) {
      correlationId = "";
    }
    req.headers["x-correlation-id"] = correlationId;
  }

  res.setHeader("x-correlation-id", correlationId);
  next();
};

export const loggerMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const correlationId = req.headers["x-correlation-id"];
  logger.defaultMeta = { correlationId };
  next();
};
