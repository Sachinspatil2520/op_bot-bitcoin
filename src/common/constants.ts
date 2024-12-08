import axios from "axios";
import { AlertInterval } from "./enums";
import { configureEnv } from "./config";

configureEnv();

export const MAGICEDEN_URL = "https://api-mainnet.magiceden.dev";

export const UNISAT_URL = "https://open-api.unisat.io";

export const MEMPOOL_URL = "https://mempool.space";

export const CAT721_URL = "https://tracker.catprotocol.ordbit.io";

export const API_LIMIT = 3;

export const WALLET_ADDRESS_REGEX = /^[a-zA-Z0-9]+$/;

export const START_CONVO_REGEX = /^(hey|hi|hello)$/i;

export const magicedenAxiosInstance = axios.create({
  baseURL: MAGICEDEN_URL,
  headers: {
    Authorization: `Bearer ${process.env.MAGICEDEN_TOKEN}`,
  },
});

export const unisatAxiosInstance = axios.create({
  baseURL: UNISAT_URL,
  headers: {
    Authorization: `Bearer ${process.env.UNISAT_TOKEN}`,
  },
});

export const cat721AxiosInstance = axios.create({
  baseURL: CAT721_URL,
});

export class CustomError extends Error {
  public errorType: string;
  public statusCode: number;
  public errorCode: string;

  constructor(
    errorType: string,
    errorMessage: string,
    statusCode: number,
    errorCode: string
  ) {
    super(errorMessage);
    this.name = this.constructor.name;
    this.errorType = errorType;
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export const ErrorCodes = {
  GENERIC_ERROR: function (
    message: string = "Something went wrong, please try again"
  ) {
    return new CustomError("InternalServerError", message, 500, "APIRUNES001");
  },
};

export const BotMessages = {
  WelcomeMessage: "Hey, 👋🟧 Welcome! ⚡₿\n\nWhat would you like to do? 🚀📈🛠️",
  HelpMessage: "Try saying Hi or Hello",
  AddBtcWalletMessage: "Please enter your BTC wallet address",
  ErrorReplyMessage: "⚠️ There was an error\nTry again later",
  WalletConnectionDeclinedMessage:
    "⚠️ Unisat wallet connection request was declined",
  AlertIntervalUpdateMessage: "Successfully updated the alert interval 🕒",
  ChooseWalletType: "Please choose the type of wallet 👛",
  NewUserMessage: "Hey, seems like you are new here! 👋",
  InvalidAddressMessage: "Address you entered is not valid ❌",
  WalletExistsMessage: "This wallet address already exists",
  NoRunesMessage: "No runes found in this wallet 🤷‍♂️",
  WalletProcessedMessage: "Successfully added/updated the wallet ✅",
  ChooseAlertIntervalMessage:
    "🕒 Choose any of these intervals to receive an alert",
  SummaryOptionsMessage: "Choose what kind of summary you want from below",
  NoUserMessage: "Get started by adding a wallet 👛",
  WaitForUpdatingWalletMessage:
    "⌛ Please wait while we look for your assets...",
  AddFBtcWallet: "Please enter your Fractal BTC wallet address",
  ChooseOneOptionMessage: "Choose one of the options: ",
} as const;
