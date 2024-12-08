export enum Chain {
  BITCOIN = "BITCOIN",
  FRACTAL_BITCOIN = "FRACTAL_BITCOIN",
}

export enum AssetType {
  RUNE = "RUNE",
  INSCRIPTION = "INSCRIPTION",
  BRC20 = "BRC20",
}

export enum TimeType {
  DAY1 = "day1",
  DAY7 = "day7",
  DAY30 = "day30",
}

export enum AlertInterval {
  HOUR1 = "HOUR1",
  HOUR3 = "HOUR3",
  HOUR6 = "HOUR6",
}

export enum MarketPlaceName {
  MAGICEDEN = "MAGICEDEN",
  UNISAT = "UNISAT",
}

export enum CallBackQuery {
  ADD_WALLET = "addWallet",
  ADD_BTC_WALLET = "addBtcWallet",
  ADD_FBTC_WALLET = "addFBtcWallet",
  CONNECT_UNISAT_WALLET = "connectUnisat",
  CONNECT_BTC_WALLET = "connectBtcWallet",
  CONNECT_FBTC_WALLET = "connectFbtcWallet",
  ENTER_WALLET_ADDRESS = "enterWallet",
  HANDLE_BTC_ALERTS = "handleBtcAlerts",
  HANDLE_FBTC_ALERTS = "handleFbtcAlerts",
  VIEW_WALLET = "viewWallet",
  HANDLE_ALERTS = "handleAlerts",
  GET_PORTFOLIO_SUMMARY = "getPortfolioSummary",
  GET_OVERALL_SUMMARY = "getOverallSummary",
  GET_WALLETWISE_SUMMARY = "getWalletwiseSummary",
  CHANGE_ALERT_INTERVAL = "changeAlertInterval",
  CHANGE_ALERT_1H = "changeAlert1H",
  CHANGE_ALERT_3H = "changeAlert3H",
  CHANGE_ALERT_6H = "changeAlert6H",
  GET_ALERT_NOW = "getAlertNow",
}
