import { Context } from "grammy";
import { customLogger } from "../logger/logger";
import { getUserByTgId } from "../repo/users/getUserByTgId";
import { IUserConfig } from "../common/interfaces";
import * as _ from "lodash";
import { AlertInterval, Chain } from "../common/enums";
import { updateUser } from "../repo/users/updateUser";
import { Prisma } from "../db/generated/client";
import { json } from "stream/consumers";
import { BotMessages } from "../common/constants";
import { getUserByChain } from "../repo/users/getUserByChain";

export const changeBtcAlertInterval = async (
  ctx: Context,
  alertInterval: AlertInterval
) => {
  const logger = customLogger("changeBtcAlertInterval");
  const telegramId = ctx.from ? ctx.from.id : "";
  try {
    logger.info("getting user info", telegramId);

    const user = await getUserByChain(telegramId.toString(), Chain.BITCOIN);
    if (_.isNull(user)) {
      logger.error("error getting user info");
      ctx.reply(BotMessages.ErrorReplyMessage);
      return null;
    }

    logger.info("successfully got user info", user);
    const userConfig = user.config as IUserConfig;
    userConfig.alert_interval = alertInterval;

    const data: Prisma.usersUpdateInput = {
      config: JSON.parse(JSON.stringify(userConfig)),
    };
    logger.info("updating the data", data);
    const updatedUser = await updateUser(user.id, data);
    if (_.isNull(updatedUser)) {
      logger.error("error updating alert interval for user");
      ctx.reply(BotMessages.ErrorReplyMessage);
      return;
    }

    logger.info("succesfully updated the user interval", updatedUser);
    await ctx.reply(BotMessages.AlertIntervalUpdateMessage);
    return;
  } catch (e) {
    logger.error("error updating alert interval", e);
    ctx.reply(BotMessages.ErrorReplyMessage);
    return null;
  }
};
