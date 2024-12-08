// import { Bot } from "grammy";
import {
  IAlertResponse,
  IBtcOverallWalletSummary,
  IBtcWalletSummary,
} from "../common/interfaces";
import { List, template } from "lodash";
import { customLogger } from "../logger/logger";
import Handlebars, { logger } from "handlebars";
import fs from "fs";
import { mainMenuButtons } from "./uiComponents";
import { TgBot } from "../TgBotInstance";
import { BotMessages } from "../common/constants";

// TODO: show net asset value in btc and dollars and instead of the emoji use the text
// TODO: in wallet summary show only upto 4 decimal places in btc
// TODO: in main menu itself get wallet wise summary should be added
// TODO: omit rune percentage for now
const botInstance = TgBot.getInstance();
const bot = botInstance.getBot();

export const sleep = (delay: number) =>
  new Promise((resolve) => setTimeout(resolve, delay));

export const sendTgMessage = async (telegramId: string, message: string) => {
  await bot.api.sendMessage(telegramId, `${message}`);
};

export const sendTelegramMessage = async (
  telegramId: string,
  message: string
) => {
  await bot.api.sendMessage(telegramId, `${message}`, {
    parse_mode: "MarkdownV2",
    link_preview_options: {
      is_disabled: true,
    },
  });
};

export const sendTelegramMainMenu = async (telegramId: string) => {
  await bot.api.sendMessage(telegramId, BotMessages.WelcomeMessage, {
    reply_markup: mainMenuButtons,
  });
};

export const createMarkupTextFromResp = async (resp: IAlertResponse) => {
  const text = [];
  const data = resp.data;
  const logger = customLogger("createMarkupTextFromResp");
  try {
    for (const [key, value] of data.entries()) {
      text.push(`Your assets for wallet: _${key}_`);
      for (const asset of value) {
        const templateContent = await fs.promises.readFile(
          "src/common/templates/RunesAlert.hbs",
          "utf8"
        );

        const template = Handlebars.compile(templateContent);
        const msg = template({
          assetName: asset.name,
          balance: asset.balance,
          magicedenPrice: asset.magicedenPrice,
          magicedenPriceUSD: asset.magicedenPriceInUSD,
          symbol: asset.symbol,
          magicedenURL: encodeURI(asset.magicedenUrl),
        });

        logger.info("text message created is: ", msg);
        text.push(msg);
      }
      text.push("****");
    }
    const markupText = text
      .join("\n")
      .replace(/\./g, "\\.")
      .replace(/\=/g, "\\=")
      .replace(/\-/g, "\\-")
      .replace(/\|/g, "\\|");
    return markupText;
  } catch (e) {
    logger.error("error getting data from templates", e);
    return null;
  }
};

export const createMarkupForOverallSummary = async (
  summary: IBtcOverallWalletSummary
) => {
  const logger = customLogger("createMarkupForOverallSummary");
  try {
    logger.info("getting template");

    const templateContent = await fs.promises.readFile(
      "src/common/templates/OverallWalletSummary.hbs",
      "utf8"
    );

    logger.info("the template file is: ", templateContent);

    const template = Handlebars.compile(templateContent);

    const msg = template({
      totalWallets: summary.totalWallets,
      totalAssets: summary.totalAssets,
      valueInBtc: summary.totalValueInBtc,
      valueInUsd: summary.totalValueInUsd,
      // runesPercentage: summary.runesPercentage,
    });

    const summarymsg = msg.replace(/\./g, "\\.");
    return summarymsg;
  } catch (e) {
    logger.error("error getting template file", e);
    return null;
  }
};

export const createMarkupForWalletSummary = async (
  walletSummary: IBtcWalletSummary
) => {
  const logger = customLogger("createMarkupForWalletSummary");
  try {
    logger.info("getting template");

    const templateContent = await fs.promises.readFile(
      "src/common/templates/WalletSummary.hbs",
      "utf8"
    );
    logger.info("the template file is: ", templateContent);

    const template = Handlebars.compile(templateContent);

    const msg = template({
      totalAssets: walletSummary.totalAssets,
      valueInBtc: walletSummary.totalValueInBtc,
      valueInUsd: walletSummary.totalValueInUsd,
      runesPercentage: walletSummary.runesPercentage,
    });

    const summarymsg = msg.replace(/\./g, "\\.");
    return summarymsg;
  } catch (e) {
    logger.error("error getting template file", e);
    return null;
  }
};
