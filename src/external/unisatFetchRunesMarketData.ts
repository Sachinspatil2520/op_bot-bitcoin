import { customLogger } from "../logger/logger";
import { TimeType } from "../common/enums";
import { TUnisatRunesMarketData } from "../common/types";
import axios from "axios";
import { token } from "morgan";
import { UNISAT_URL, unisatAxiosInstance } from "../common/constants";

export const unisatFetchRunesMarketData = async (
  time: TimeType = TimeType.DAY1,
  tick: string
) => {
  const logger = customLogger("unisatFetchRunesMarketData");
  try {
    logger.info("getting runes market data from unisat api", time, tick);
    if (tick === "") {
      logger.warn("tick cannot be empty");
      return null;
    }

    const payload = {
      timeType: time,
      tick: tick,
    };

    logger.info("the unisat instance is : ", unisatAxiosInstance);

    const resp = await unisatAxiosInstance.post(
      "/v3/market/runes/auction/runes_types_specified",
      payload
    );

    if (resp.status !== 200) {
      logger.error("error getting response from unisat api", tick);
      return null;
    }
    logger.info("successfully received the runes info from unisat", resp.data);

    return resp.data as TUnisatRunesMarketData;
  } catch (e) {
    logger.error("error fetching unisat api for tick", tick, e);
    return null;
  }
};
