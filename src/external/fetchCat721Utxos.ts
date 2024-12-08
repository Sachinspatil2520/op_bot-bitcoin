import { customLogger } from "../logger/logger";
import { cat721AxiosInstance } from "../common/constants";
import { TCat721UtxoResp, TCatCollectionsWalletResp } from "../common/types";
import _ from "lodash";

export const fetchCat721Utxos = async (
  wallet: string,
  collectionId: string
) => {
  const logger = customLogger("fetchCat721Utxos");
  try {
    logger.info("fetching all utxos of a collection for given wallet", {
      wallet: wallet,
      collectionId: collectionId,
    });

    const resp = await cat721AxiosInstance.get(
      `/api/collections/${collectionId}/addresses/${wallet}/utxos`
    );
    if (resp.status !== 200) {
      logger.error("error fetching cat collection utxos for wallet", {
        wallet: wallet,
        collectionId: collectionId,
      });
      return null;
    }

    logger.info("successfully got cat collection holdings for wallet", {
      wallet: wallet,
      collectionId: collectionId,
    });
    return resp.data as TCat721UtxoResp;
  } catch (e) {
    logger.error("error getting cat collection utxos", e);
    return null;
  }
};
