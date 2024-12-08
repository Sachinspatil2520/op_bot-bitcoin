import { customLogger } from "../../logger/logger";
import { AlertInterval, Chain } from "../../common/enums";
import { prisma } from "../../db/client";
import { Prisma } from "../../db/generated/client";
import { JsonObject } from "../../db/generated/client/runtime/library";
import * as _ from "lodash";
import { IUserConfig } from "../../common/interfaces";
import { InputJsonValue } from "@prisma/client/runtime/library";

export const getUsersByAlertInterval = async (
  alertInterval: AlertInterval,
  chain: Chain
) => {
  const logger = customLogger("getUsersByAlertInterval");
  try {
    logger.info("getting users with alert interval", alertInterval);

    const users = await prisma.users.findMany({
      where: {
        config: {
          path: ["alert_interval"],
          equals: alertInterval,
        },
        blockChain: chain,
      },
    });

    logger.info("got all users with time interval", alertInterval, users);
    return users;
  } catch (e) {
    logger.error("error getting users from db", e);
    return null;
  }
};
