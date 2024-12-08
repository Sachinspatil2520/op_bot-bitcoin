import { Context } from "grammy";
import { customLogger } from "../logger/logger";
import { getUserByTgId } from "../repo/users/getUserByTgId";
import Handlebars from "handlebars";
import fs from "fs";
import * as _ from "lodash";
import { Chain } from "../common/enums";

export const getUserWalletsInfo = async (ctx: Context) => {
  const logger = customLogger("getUserInfo");
  const telegramId = ctx.from ? ctx.from.id : "";
  try {
    logger.info("getting user info", telegramId);

    const users = await getUserByTgId(telegramId.toString());
    if (_.isNull(users)) {
      logger.error("error getting user info");
      return null;
    }

    logger.info("successfully got user info", users.length);

    for (const user of users) {
      if (user.blockChain === Chain.BITCOIN) {
        // const template1 = Handlebars.compile(
        //   `Hey {{username}}\nYou currently have {{walletCount}} Bitcoin wallets\n`
        // );
        // const template2 = Handlebars.compile(
        //   `Your wallets are:\n{{#each wallets}}{{this}}\n{{/each}}`
        // );
        const templateContent = await fs.promises.readFile(
          "src/common/templates/UserWalletInfo.hbs",
          "utf8"
        );

        logger.info("the template file is: ", templateContent);

        const template = Handlebars.compile(templateContent);
        const msg1 = template({
          username: user.name,
          walletCount: user.walletAddresses.length,
          chain: _.capitalize(Chain.BITCOIN),
          chainEmoji: "🟠",
          wallets: user.walletAddresses,
        });
        const msg = msg1.replace(/\_/g, "\\_");

        await ctx.reply(msg, { parse_mode: "MarkdownV2" });
      } else if (user.blockChain === Chain.FRACTAL_BITCOIN) {
        const templateContent = await fs.promises.readFile(
          "src/common/templates/UserWalletInfo.hbs",
          "utf8"
        );

        logger.info("the template file is: ", templateContent);

        const template = Handlebars.compile(templateContent);
        const msg1 = template({
          username: user.name,
          walletCount: user.walletAddresses.length,
          chain: _.capitalize(Chain.FRACTAL_BITCOIN),
          chainEmoji: "⚫️",
          wallets: user.walletAddresses,
        });
        const msg = msg1.replace(/\_/g, "\\_");

        await ctx.reply(msg, { parse_mode: "MarkdownV2" });
      }
    }
    return null;
  } catch (e) {
    logger.error("error getting user info", e);
    return null;
  }
};
