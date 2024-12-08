import { assets, users } from "../db/generated/client";
import { customLogger } from "../logger/logger";
import { getUserAssetsByWallet } from "../repo/users_assets/getUserAssetsByWallet";
import { getAllAssetsByIds } from "../repo/assets/getAllAssetsByIds";
import { BotMessages } from "../common/constants";
import { IUserAssets } from "../common/interfaces";
import * as _ from "lodash";

export const getAssetsByUser = async (user: users) => {
  const logger = customLogger("getAssetsByUser");
  try {
    logger.info(
      "getting all the users_assets entries for the given user",
      user
    );

    const allAssets: IUserAssets = {
      data: new Map(),
    };

    for (const wallet of user.walletAddresses) {
      logger.info("getting assets for the wallet address", wallet);

      const userAssetsData = await getUserAssetsByWallet(user.id, wallet);
      if (_.isNull(userAssetsData)) {
        logger.error("error getting user assets data");
        return null;
      }
      if (userAssetsData.length === 0) {
        logger.info("no assets found in the wallet", wallet);
        continue;
      }

      logger.info("received user assets data for the wallet address", wallet);

      const assetIds: string[] = userAssetsData.map((uadata) => {
        return uadata.assetId;
      });

      logger.info("got all the asset ids for the wallet", wallet);

      logger.info("getting all asset infos for the wallet", wallet);

      const assets = await getAllAssetsByIds(assetIds);
      if (_.isNull(assets)) {
        logger.error("error getting all the assets for wallet", wallet);
        return null;
      }

      logger.info("received all the assets info for wallet", wallet, assets);
      allAssets.data.set(wallet, assets);
    }
    logger.info("got all assets for the given user");
    return allAssets;
  } catch (e) {
    logger.error("error getting assets for user", e);
    return null;
  }
};
