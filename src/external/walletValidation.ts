import axios from "axios";
import { customLogger } from "../logger/logger";
import { TAddressValidationResp } from "../common/types";
import { MEMPOOL_URL } from "../common/constants";

export const walletValidation = async (wallet: string) => {
  const logger = customLogger("walletValidation");
  try {
    logger.info("checking if address is valid", wallet);

    const endpoint = `${MEMPOOL_URL}/api/v1/validate-address/${wallet}`;

    const resp = await axios.get(endpoint);
    if (resp.status !== 200) {
      logger.error("error getting response from mempool api", wallet);
      return null;
    }

    logger.info("successfully received the response from mempool", resp.data);
    logger.info("resp is", resp.data.isvalid);

    return resp.data as TAddressValidationResp;
  } catch (e) {
    logger.error("error getting address validation", e);
    return null;
  }
};
