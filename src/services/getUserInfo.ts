import { Context } from "grammy";
import { customLogger } from "../logger/logger";
import { BotMessages } from "../common/constants";
import { getUserByTgId } from "../repo/users/getUserByTgId";
import { onBoardingButtons } from "../utils/uiComponents";
import _, { chain } from "lodash";
import { sendTelegramMainMenu } from "../utils/utils";
import { AssetType, Chain } from "../common/enums";

export const getUserInfo = async (ctx: Context) => {
  const logger = customLogger("getUserInfo");
  try {
    logger.info("getting user info");
    const tgId = ctx.from?.id.toString() || "";
    const user = await getUserByTgId(tgId);
    if (_.isNull(user)) {
      logger.info("no user found");
      ctx.reply(BotMessages.NoUserMessage, {
        reply_markup: onBoardingButtons,
      });
      return;
    }

    logger.info("successfully got user info", user);
    sendTelegramMainMenu(ctx.from?.id.toString() || "");
    return;
  } catch (e) {
    logger.error("error getting user info", e);
    ctx.reply(BotMessages.ErrorReplyMessage);
    return;
  }
};
