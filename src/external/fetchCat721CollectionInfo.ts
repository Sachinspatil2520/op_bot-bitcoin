import { cat721AxiosInstance } from "../common/constants";
import { customLogger } from "../logger/logger";
import {
  TCatCollectionInfoResp,
  TCatCollectionsWalletResp,
} from "../common/types";
import _ from "lodash";

export const fetchCat721CollectionInfo = async (collectionId: string) => {
  const logger = customLogger("fetchCat721CollectionInfo");
  try {
    logger.info("fetching collection info", collectionId);

    const resp = await cat721AxiosInstance.get(
      `/api/collections/${collectionId}`
    );
    if (resp.status !== 200) {
      logger.error(
        "error fetching cat collection info for collection",
        collectionId
      );
      return null;
    }

    logger.info(
      "successfully got cat collection info for collection",
      collectionId
    );
    return resp.data as TCatCollectionInfoResp;
  } catch (e) {
    logger.error("error getting cat collection info", e);
    return null;
  }
};
