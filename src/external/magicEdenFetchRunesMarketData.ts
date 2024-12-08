import { customLogger } from "../logger/logger";
import { TimeType } from "../common/enums";
import { TMagicEdenRunesMarketData } from "../common/types";
import axios from "axios";
import { token } from "morgan";
import { MAGICEDEN_URL, magicedenAxiosInstance } from "../common/constants";

export const magicEdenFetchRunesMarketData = async (ticker: string) => {
  const logger = customLogger("magicEdenFetchRunesMarketData");
  try {
    logger.info("getting runes market data from magiceden api", ticker);
    if (ticker === "") {
      logger.warn("ticker cannot be empty");
      return null;
    }

    const resp = await magicedenAxiosInstance.get(
      `/v2/ord/btc/runes/market/${ticker}/info`
    );

    if (resp.status !== 200) {
      logger.error("error getting response from magiceden api", ticker);
      return null;
    }

    logger.info("received runes info", resp.data);

    return resp.data as TMagicEdenRunesMarketData;
  } catch (e) {
    logger.error("error fetching magiceden api for tick", ticker, e);
    return null;
  }
};
