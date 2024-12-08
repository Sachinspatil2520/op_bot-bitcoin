import { Context, InlineKeyboard } from "grammy";
import { CallBackQuery } from "../common/enums";
import { INSPECT_MAX_BYTES } from "buffer";

export const onBoardingButtons = new InlineKeyboard().row(
  InlineKeyboard.text("👝 Add a wallet", CallBackQuery.ADD_WALLET)
);

export const mainMenuButtons = new InlineKeyboard()
  .row(InlineKeyboard.text("👝 Add a new wallet", CallBackQuery.ADD_WALLET))
  .row(
    InlineKeyboard.text("👛 Check existing wallets", CallBackQuery.VIEW_WALLET)
  )
  .row(InlineKeyboard.text("🔔 Handle alerts", CallBackQuery.HANDLE_ALERTS))
  .row(
    InlineKeyboard.text(
      "📋 Get Overall Summary",
      CallBackQuery.GET_OVERALL_SUMMARY
    )
  )
  .row(
    InlineKeyboard.text(
      "👝📋 Get Walletwise Summary",
      CallBackQuery.GET_WALLETWISE_SUMMARY
    )
  );

export const addWalletOptions = new InlineKeyboard()
  .row(
    InlineKeyboard.text(
      "🔗 Connect Unisat Wallet",
      CallBackQuery.CONNECT_UNISAT_WALLET
    )
  )
  .row(
    InlineKeyboard.text(
      "⌨️ Enter Wallet Address",
      CallBackQuery.ENTER_WALLET_ADDRESS
    )
  );

export const unisatWalletChain = new InlineKeyboard()
  .row(
    InlineKeyboard.text("Bitcoin Wallet 🟠₿", CallBackQuery.CONNECT_BTC_WALLET)
  )
  .row(
    InlineKeyboard.text(
      "Fractal Bitcoin Wallet ⚫️₿",
      CallBackQuery.CONNECT_FBTC_WALLET
    )
  );

export const enterAddressOptions = new InlineKeyboard()
  .row(InlineKeyboard.text("Bitcoin Wallet 🟠₿", CallBackQuery.ADD_BTC_WALLET))
  .row(
    InlineKeyboard.text(
      "Fractal Bitcoin Wallet ⚫️₿",
      CallBackQuery.ADD_FBTC_WALLET
    )
  );

export const addWalletMethod = new InlineKeyboard().row(
  InlineKeyboard.text("Connect Wallet")
);

export const handleAlertsOptions = new InlineKeyboard().row(
  InlineKeyboard.text(
    "🔔 Alerts on Bitcoin Wallet",
    CallBackQuery.HANDLE_BTC_ALERTS
  )
);
// .row(
//   InlineKeyboard.text(
//     "Alerts on Fractal Bitcoin Wallet",
//     CallBackQuery.HANDLE_FBTC_ALERTS
//   )
// );

export const alertMenuButtons = new InlineKeyboard()
  .row(
    InlineKeyboard.text(
      "⌛ Change alert interval",
      CallBackQuery.CHANGE_ALERT_INTERVAL
    )
  )
  .row(InlineKeyboard.text("❗ Get an alert now", CallBackQuery.GET_ALERT_NOW));

export const changeAlertButtons = new InlineKeyboard()
  .row(InlineKeyboard.text("Every 1️⃣ hour", CallBackQuery.CHANGE_ALERT_1H))
  .row(InlineKeyboard.text("Every 3️⃣ hour", CallBackQuery.CHANGE_ALERT_3H))
  .row(InlineKeyboard.text("Every 6️⃣ hour", CallBackQuery.CHANGE_ALERT_6H));
