import axios from "axios";
import { TRunesResponse } from "../common/types";
import { customLogger } from "../logger/logger";

export const fetchRunesRequest = async (address: string) => {
  const logger = customLogger("fetchRunesRequest");
  try {
    logger.info("fetching runes for given wallet", address);
    if (address === "") {
      logger.warn("address is empty");
      return null;
    }
    const endpoint = `${process.env.ORD_URL}/v1/data/runes/wallets/${address}?network=mainnet`;
    logger.info("getting runes from :", endpoint);
    const response = await axios.get(endpoint, {
      headers: { "X-API-Key": process.env.ORD_X_API_KEY },
    });
    logger.info("response data is : ", response.data);
    return response.data as TRunesResponse;
  } catch (e) {
    logger.error("error getting runes data", { error: e });
    return null;
  }
};
