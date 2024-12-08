import { match } from "assert";
import express from "express";
import { Bot, InlineKeyboard, InlineQueryResultBuilder } from "grammy";
import morgan from "morgan";
import { addBitcoinWallet } from "./services/addBitcoinWallet";
import {
  correlationIdMiddleware,
  loggerMiddleware,
} from "./logger/loggerMiddleware";
import { customLogger } from "./logger/logger";
import { updateRunesPrice } from "./apis/updateRunesPrice";
import {
  AlertInterval,
  AssetType,
  CallBackQuery,
  Chain,
  TimeType,
} from "./common/enums";
import { Prisma } from "./db/generated/client";
import { magicEdenFetchRunesMarketData } from "./external/magicEdenFetchRunesMarketData";
import { ICreateAssetsPayload } from "./common/interfaces";
import { createAssets } from "./apis/createAssets";
import { sendUserAlerts } from "./apis/sendUserAlerts";
import { HttpStatusCode } from "axios";
import { Http } from "winston/lib/winston/transports";
import { getUserInfo } from "./services/getUserInfo";
import { handleBtcAlerts } from "./services/handleBtcAlerts";
import { changeBtcAlertInterval } from "./services/changeBtcAlertInterval";
import { sendAlertToUser } from "./services/sendAlertToUser";
import { updateAllWallets } from "./services/updateAllWallets";
import { getWalletSummary } from "./services/getWalletSummary";
import { addFractalBitcoinWallet } from "./services/addFractalBitcoinWallet";
import { connectUnisatWallet } from "./services/connectUnisatWallet";
import {
  BotMessages,
  START_CONVO_REGEX,
  WALLET_ADDRESS_REGEX,
} from "./common/constants";
import {
  mainMenuButtons,
  addWalletOptions,
  alertMenuButtons,
  changeAlertButtons,
  handleAlertsOptions,
  unisatWalletChain,
  enterAddressOptions,
} from "./utils/uiComponents";
import * as _ from "lodash";
import { unisatFetchRunesMarketData } from "./external/unisatFetchRunesMarketData";
import { getOverallPortfolioSummary } from "./services/getOverallPortfolioSummary";
import {
  sendTelegramMainMenu,
  sendTelegramMessage,
  sleep,
} from "./utils/utils";
import { configureEnv } from "./common/config";
import cron from "node-cron";
import { TgBot } from "./TgBotInstance";
import { log } from "console";
import { getUserWalletsInfo } from "./services/getUserWalletsInfo";
import { fetchCat721CollectionInfo } from "./external/fetchCat721CollectionInfo";
import fs from "fs";

configureEnv();

const app = express();

const logger = customLogger("server");

const botInstance = TgBot.getInstance();
const bot = botInstance.getBot();

app.use(morgan("combined"));

app.use(correlationIdMiddleware);
app.use(loggerMiddleware);
app.use(express.json({ limit: "50mb" }));

const host = process.env.SERVER_HOST_NAME || "localhost";
const port = process.env.PORT || 8000;

app.get("/v1/healthz", (req, res) => {
  try {
    res.sendStatus(HttpStatusCode.Ok);
  } catch (e) {
    logger.error("error on endpoint: /v1/healthz", e);
    res.sendStatus(HttpStatusCode.InternalServerError);
  }
});

app.post("/v1/assets/add", async (req, res) => {
  try {
    logger.info("/assets/add endpoint called", {
      body: req.body,
    });
    const payload = req.body as ICreateAssetsPayload;

    const resp = await createAssets(payload);
    if (!_.isNull(resp)) {
      res.status(resp.statusCode).json(resp);
      return;
    }

    logger.info("successfully added the assets");
    res.sendStatus(200);
  } catch (e) {
    logger.error("error on endpoint: /v1/assets/add", e);
    res.sendStatus(HttpStatusCode.InternalServerError);
  }
});

app.get("/v1/assets/update-marketdata", async (req, res) => {
  try {
    logger.info("/assets/update-marketdata endpoint called");
    const err = updateRunesPrice();
    logger.info("successfully updated all the assets");
    res.sendStatus(HttpStatusCode.Ok);
  } catch (e) {
    logger.error("error on endpoint: /v1/assets/update-marketdata", e);
    res.sendStatus(HttpStatusCode.InternalServerError);
  }
});

app.get("/v1/users/send-marketdata", async (req, res) => {
  try {
    logger.info("/users/send-alert endpoint called");
    const interval = req.query.alert_interval as AlertInterval;
    if (_.isNull(interval)) {
      res.sendStatus(HttpStatusCode.BadRequest);
      return;
    }
    const resp = await sendUserAlerts(interval);
    if (!_.isNull(resp)) {
      res.status(resp.statusCode).json(resp);
      return;
    }

    res.sendStatus(HttpStatusCode.Ok);
  } catch (e) {
    logger.error("error on endpoint: /v1/users/send-marketdata", e);
    res.sendStatus(HttpStatusCode.InternalServerError);
  }
});

app.get("/redirect-unisat-wallet", async (req, res) => {
  try {
    const tgId = req.query.tgId;
    const name = req.query.name;
    const chain = req.query.chain?.toString() || Chain.BITCOIN;

    const payload = tgId + "," + name;
    logger.info("the tgId is : ", tgId);

    const endpoint =
      chain === Chain.BITCOIN
        ? `unisat://request?method=connect&from=http://${host}:${port}/manage-unisat-resp/btc-wallet?payload=${payload}`
        : `unisat://request?method=connect&from=http://${host}:${port}/manage-unisat-resp/fbtc-wallet?payload=${payload}`;

    res.redirect(endpoint);
  } catch (e) {
    logger.error("error on /redirect-unisat-wallet", e);
    res.sendStatus(500);
    return;
  }
});

app.get("/manage-unisat-resp/btc-wallet", async (req, res) => {
  try {
    const payload = req.query.payload?.toString() || "";

    logger.info("response sent by unisat for bitcoin wallet is", payload);

    const botName = process.env.BOT_USER_NAME || "";
    const telegramEndpoint = `https://t.me/${botName}`;

    res.redirect(telegramEndpoint);

    await connectUnisatWallet(payload, Chain.BITCOIN);
  } catch (e) {
    logger.error("error on /manage-unisat-resp", e);
    res.sendStatus(500);
    return;
  }
});

app.get("/manage-unisat-resp/fbtc-wallet", async (req, res) => {
  try {
    const payload = req.query.payload?.toString() || "";

    logger.info("response sent by unisat for fractal wallet is", payload);

    const botName = process.env.BOT_USER_NAME || "";
    const telegramEndpoint = `https://t.me/${botName}`;

    res.redirect(telegramEndpoint);

    await connectUnisatWallet(payload, Chain.FRACTAL_BITCOIN);
  } catch (e) {
    logger.error("error on /manage-unisat-resp", e);
    res.sendStatus(500);
    return;
  }
});

app.listen(Number(port), host, () =>
  logger.info(`App listening on host ${host} and port ${port}`)
);

bot.command("start", async (ctx) => {
  logger.info("start command received");
  const payload = ctx.match;
  logger.info("the payload is : ", payload);
  await getUserInfo(ctx);
});

bot.command("help", async (ctx) => {
  logger.info("help command received");
  ctx.reply(BotMessages.HelpMessage);
});

bot.command("test", async (ctx) => {
  logger.info("calling test");
  const templateContent = await fs.promises.readFile(
    "src/common/templates/UserWalletInfo.hbs",
    "utf8"
  );

  logger.info("the template file is: ", templateContent);
});

bot.hears(START_CONVO_REGEX, async (ctx) => {
  logger.info("received a greeting", ctx.message?.text);
  await getUserInfo(ctx);
});

bot.hears(WALLET_ADDRESS_REGEX, async (ctx) => {
  const replyToMsg = ctx.message?.reply_to_message
    ? ctx.message?.reply_to_message?.text
    : null;
  logger.info("reply is", replyToMsg);
  if (replyToMsg === BotMessages.AddBtcWalletMessage) {
    logger.info(
      "it is a reply to add btc message",
      ctx.message?.reply_to_message?.text
    );
    await addBitcoinWallet(ctx);
    await sleep(2000);
    await sendTelegramMainMenu(ctx.from?.id.toString() || "");
  } else if (replyToMsg === BotMessages.AddFBtcWallet) {
    logger.info(
      "it is a reply to add fbtc message",
      ctx.message?.reply_to_message?.text
    );
    await addFractalBitcoinWallet(ctx);
    await sleep(2000);
    await sendTelegramMainMenu(ctx.from?.id.toString() || "");
  } else {
    logger.info("message recieved", { message: ctx.message?.text });
    await getUserInfo(ctx);
  }
});

bot.on("message", async (ctx) => {
  logger.info("message recieved", { message: ctx.message.text });
  await getUserInfo(ctx);
});

bot.callbackQuery(CallBackQuery.ADD_WALLET, async (ctx) => {
  ctx.reply(BotMessages.ChooseOneOptionMessage, {
    reply_markup: addWalletOptions,
  });
});

bot.callbackQuery(CallBackQuery.CONNECT_UNISAT_WALLET, async (ctx) => {
  ctx.reply(BotMessages.ChooseOneOptionMessage, {
    reply_markup: unisatWalletChain,
  });
});

bot.callbackQuery(CallBackQuery.ENTER_WALLET_ADDRESS, async (ctx) => {
  ctx.reply(BotMessages.ChooseOneOptionMessage, {
    reply_markup: enterAddressOptions,
  });
});

bot.callbackQuery(CallBackQuery.CONNECT_BTC_WALLET, async (ctx) => {
  const tgId = ctx.from.id;
  const name = ctx.from.username;
  const chain = Chain.BITCOIN;

  const endpoint = `http://${host}:${port}/redirect-unisat-wallet?tgId=${tgId}&name=${name}&chain=${chain}`;
  ctx.reply(`👝 [Click here to connect](${endpoint})`, {
    parse_mode: "MarkdownV2",
  });
});

bot.callbackQuery(CallBackQuery.CONNECT_FBTC_WALLET, async (ctx) => {
  const tgId = ctx.from.id;
  const name = ctx.from.username;
  const chain = Chain.FRACTAL_BITCOIN;

  const endpoint = `http://${host}:${port}/redirect-unisat-wallet?tgId=${tgId}&name=${name}&chain=${chain}`;
  ctx.reply(`👝 [Click here to connect](${endpoint})`, {
    parse_mode: "MarkdownV2",
  });
});

bot.callbackQuery(CallBackQuery.ADD_BTC_WALLET, async (ctx) => {
  ctx.reply(BotMessages.AddBtcWalletMessage, {
    reply_markup: {
      force_reply: true,
      input_field_placeholder: "Enter address here",
    },
  });
});

bot.callbackQuery(CallBackQuery.ADD_FBTC_WALLET, async (ctx) => {
  ctx.reply(BotMessages.AddFBtcWallet, {
    reply_markup: {
      force_reply: true,
      input_field_placeholder: "Enter address here",
    },
  });
});

bot.callbackQuery(CallBackQuery.VIEW_WALLET, async (ctx) => {
  logger.info("view wallets called");
  await getUserWalletsInfo(ctx);
  await sleep(2000);
  await sendTelegramMainMenu(ctx.from.id.toString());
});

bot.callbackQuery(CallBackQuery.HANDLE_ALERTS, async (ctx) => {
  handleBtcAlerts(ctx);
});

// bot.callbackQuery(CallBackQuery.HANDLE_BTC_ALERTS, async (ctx) => {
//   handleBtcAlerts(ctx);
// });

bot.callbackQuery(CallBackQuery.CHANGE_ALERT_INTERVAL, async (ctx) => {
  ctx.reply(BotMessages.ChooseAlertIntervalMessage, {
    reply_markup: changeAlertButtons,
  });
});

bot.callbackQuery(CallBackQuery.CHANGE_ALERT_1H, async (ctx) => {
  await changeBtcAlertInterval(ctx, AlertInterval.HOUR1);
  await sleep(2000);
  await sendTelegramMainMenu(ctx.from.id.toString());
});

bot.callbackQuery(CallBackQuery.CHANGE_ALERT_3H, async (ctx) => {
  await changeBtcAlertInterval(ctx, AlertInterval.HOUR3);
  await sleep(2000);
  await sendTelegramMainMenu(ctx.from.id.toString());
});

bot.callbackQuery(CallBackQuery.CHANGE_ALERT_6H, async (ctx) => {
  await changeBtcAlertInterval(ctx, AlertInterval.HOUR6);
  await sleep(2000);
  await sendTelegramMainMenu(ctx.from.id.toString());
});

// bot.callbackQuery(CallBackQuery.GET_PORTFOLIO_SUMMARY, async (ctx) => {
//   ctx.reply(BotMessages.SummaryOptionsMessage, {
//     reply_markup: portfolioSummaryOptions,
//   });
// });

bot.callbackQuery(CallBackQuery.GET_OVERALL_SUMMARY, async (ctx) => {
  await getOverallPortfolioSummary(ctx);
  await sleep(2000);
  await sendTelegramMainMenu(ctx.from.id.toString());
});

bot.callbackQuery(CallBackQuery.GET_ALERT_NOW, async (ctx) => {
  await sendAlertToUser(ctx);
  await sleep(2000);
  await sendTelegramMainMenu(ctx.from.id.toString());
});

bot.callbackQuery(CallBackQuery.GET_WALLETWISE_SUMMARY, async (ctx) => {
  await getWalletSummary(ctx);
  await sleep(2000);
  await sendTelegramMainMenu(ctx.from.id.toString());
});

cron.schedule("45 * * * *", () => {
  logger.info("cron for marketdata update called");
  updateRunesPrice();
});

cron.schedule("0 */1 * * *", () => {
  logger.info(
    "cron schedule called for sending user alerts to users with interval of 1H"
  );
  sendUserAlerts(AlertInterval.HOUR1);
});

cron.schedule("0 */3 * * *", () => {
  logger.info(
    "cron schedule called for sending user alerts to users with interval of 3H"
  );
  sendUserAlerts(AlertInterval.HOUR3);
});

cron.schedule("0 */6 * * *", () => {
  logger.info(
    "cron schedule called for sending user alerts to users with interval of 6H"
  );
  sendUserAlerts(AlertInterval.HOUR6);
});

cron.schedule("30 * * * *", () => {
  logger.info("cron schedule called for updating user wallets");
  updateAllWallets();
});

bot.start();
