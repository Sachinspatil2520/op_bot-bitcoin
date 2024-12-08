import { customLogger } from "../../logger/logger";
import { AlertInterval } from "../../common/enums";
import { prisma } from "../../db/client";
import { Prisma } from "../../db/generated/client";
import { JsonObject } from "../../db/generated/client/runtime/library";
import * as _ from "lodash";
import { IUserConfig } from "../../common/interfaces";
import { InputJsonValue } from "@prisma/client/runtime/library";

export const getAllUsers = async () => {
  const logger = customLogger("getAllUsers");
  try {
    logger.info("getting all the users");

    const users = await prisma.users.findMany();
    if (_.isNull(users)) {
      logger.info("no users found");
      return null;
    }

    logger.info("got all users with", users);
    return users;
  } catch (e) {
    logger.error("error getting users from db", e);
    return null;
  }
};
