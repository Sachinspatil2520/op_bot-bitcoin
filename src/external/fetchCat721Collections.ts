import { customLogger } from "../logger/logger";
import { cat721AxiosInstance } from "../common/constants";
import { TCatCollectionsWalletResp } from "../common/types";
import _ from "lodash";

export const fetchCat721Collections = async (wallet: string) => {
  const logger = customLogger("fetchCat721Collections");
  try {
    logger.info("fetching all collection of wallet", wallet);

    const resp = await cat721AxiosInstance.get(
      `/api/addresses/${wallet}/collections`
    );
    if (resp.status !== 200) {
      logger.error("error fetching cat collection holdings for wallet", wallet);
      return null;
    }

    logger.info("successfully got cat collection holdings for wallet", wallet);
    return resp.data as TCatCollectionsWalletResp;
  } catch (e) {
    logger.error("error getting cat collection holdings", e);
    return null;
  }
};
