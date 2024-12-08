import { Bot } from "grammy";
import { configureEnv } from "./common/config";
import dotenv from "dotenv";
import { customLogger } from "./logger/logger";

const logger = customLogger("TgBotInstance");

export class TgBot {
  private static instance: TgBot | null = null;
  private bot: Bot;

  private constructor() {
    const token: string = process.env.BOT_API_TOKEN || "";

    this.bot = new Bot(token);
    logger.info("bot started with token", token);
  }

  public static getInstance(): TgBot {
    if (!TgBot.instance) {
      TgBot.instance = new TgBot();
    }
    return TgBot.instance;
  }

  public getBot(): Bot {
    return this.bot;
  }
}
