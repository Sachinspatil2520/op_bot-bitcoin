import { customLogger } from "../logger/logger";
import { getUserByTgId } from "../repo/users/getUserByTgId";
import * as _ from "lodash";
import { IUserConfig } from "../common/interfaces";
import { Context } from "grammy";
import { AlertInterval, Chain } from "../common/enums";
import { sendTelegramMessage } from "../utils/utils";
import { getUserByChain } from "../repo/users/getUserByChain";
import { alertMenuButtons } from "../utils/uiComponents";

export const handleBtcAlerts = async (ctx: Context) => {
  const logger = customLogger("handleAlerts");
  const telegramId = ctx.from ? ctx.from.id : "";
  try {
    logger.info("getting user info", telegramId);

    const user = await getUserByChain(telegramId.toString(), Chain.BITCOIN);
    if (_.isNull(user)) {
      logger.error("error getting user info");
      return null;
    }

    logger.info("got user info for bitcoin chain");

    const alertInterval = (user.config as IUserConfig).alert_interval;

    switch (alertInterval) {
      case AlertInterval.HOUR1: {
        const msg =
          "For your Bitcoin wallets, currently you will receive alerts every 1 Hour";
        ctx.reply(msg, { reply_markup: alertMenuButtons });
        break;
      }
      case AlertInterval.HOUR3: {
        const msg =
          "For your Bitcoin wallets, currently you will receive alerts every 3 Hours";
        ctx.reply(msg, { reply_markup: alertMenuButtons });
        break;
      }
      case AlertInterval.HOUR6: {
        const msg =
          "For your Bitcoin wallets, currently you will receive alerts every 6 Hours";
        ctx.reply(msg, { reply_markup: alertMenuButtons });
        break;
      }
    }
  } catch (e) {
    logger.error("error handling alerts", e);
    return null;
  }
};
