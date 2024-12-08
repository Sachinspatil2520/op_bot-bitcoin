import axios from "axios";
import { customLogger } from "../logger/logger";
import { MEMPOOL_URL } from "../common/constants";
import { TBtcPricesResp } from "../common/types";
import _ from "lodash";

export const fetchBtcPrices = async () => {
  const logger = customLogger("fetchBtcPrices");
  try {
    logger.info("getting btc prices");
    const endpoint = `${MEMPOOL_URL}/api/v1/prices`;

    const btcPrices = await axios.get(endpoint);
    if (_.isNull(btcPrices.data)) {
      logger.error("error getting btc prices from mempool api");
      return null;
    }

    logger.info("recieved btc prices response", btcPrices.data);
    return btcPrices.data as TBtcPricesResp;
  } catch (e) {
    logger.error("error getting btc price");
    return null;
  }
};
