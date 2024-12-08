import { User } from "grammy/types";
import { customLogger } from "../logger/logger";
import { assets, Prisma, users } from "../db/generated/client";
import { getAssetsByUser } from "./getAssetsByUser";
import _ from "lodash";
import { API_LIMIT, ErrorCodes } from "../common/constants";
import { CustomErrorResp } from "../common/interfaces";
import {
  TMagicEdenRunesMarketData,
  TRuneAssetMetadata,
  TUnisatRunesMarketData,
} from "../common/types";
import { AssetType, TimeType } from "../common/enums";
import { magicEdenFetchRunesMarketData } from "../external/magicEdenFetchRunesMarketData";
import { unisatFetchRunesMarketData } from "../external/unisatFetchRunesMarketData";
import { updateAssets } from "../repo/assets/updateAssets";
import { sleep } from "../utils/utils";

export const updateUserMarketdata = async (user: users) => {
  const logger = customLogger("updateUserMarketdata");
  try {
    const assetsData = await getAssetsByUser(user);
    if (_.isNull(assetsData)) {
      logger.error("error getting all the assets for user", user.name);
      const custErr = ErrorCodes.GENERIC_ERROR("internal error");
      return {
        statusCode: custErr.statusCode,
        errorCode: custErr.errorCode,
        body: custErr.message,
      } as CustomErrorResp;
    }

    logger.info("successfully recieved all the assets with wallet");

    const assets: assets[] = [];

    for (const [wallet, allAssets] of assetsData.data) {
      for (const asset of allAssets) {
        assets.push(asset);
      }
    }

    const magicedenPromises: Promise<TMagicEdenRunesMarketData | null>[] = [];
    const unisatPromises: Promise<TUnisatRunesMarketData | null>[] = [];

    for (let i = 0; i < assets.length; i++) {
      switch (assets[i].type) {
        case AssetType.RUNE: {
          logger.info(
            "getting runes info from magiceden for id",
            assets[i].assetId
          );

          const magicedenPromise = magicEdenFetchRunesMarketData(
            (assets[i].metadata as TRuneAssetMetadata).ticker
          );
          magicedenPromises.push(magicedenPromise);

          const metadata = assets[i].metadata as TRuneAssetMetadata;
          logger.info(
            "getting runes info from unisat for id",
            metadata.spacedName
          );

          const unisatPromise = unisatFetchRunesMarketData(
            TimeType.DAY1,
            metadata.spacedName
          );
          unisatPromises.push(unisatPromise);
          break;
        }
      }
      if (magicedenPromises.length === API_LIMIT || i == assets.length - 1) {
        const fetchedData = await Promise.all(magicedenPromises);
        logger.info(
          "recieved a batch of fetched data from magiceden",
          fetchedData
        );

        while (magicedenPromises.length > 0) {
          magicedenPromises.pop();
        }

        logger.info("updating the assets received from magiceden");
        for (const data of fetchedData) {
          logger.info("updating asset for given data", data);
          if (_.isNull(data)) {
            continue;
          }
          const type = data.rune ? AssetType.RUNE : "";
          if (type === AssetType.RUNE) {
            const runeData = data as TMagicEdenRunesMarketData;
            const asset = assets.filter(
              (asset) =>
                (asset.metadata as TRuneAssetMetadata).ticker ===
                runeData.ticker
            );
            logger.info("asset to be updated is", asset[0]);
            const updateData: Prisma.assetsUpdateInput = {
              symbol: runeData.symbol,
              magicedenMarketData: runeData,
              magicedenMarketPrice: runeData.floorUnitPrice
                ? Number(runeData.floorUnitPrice.formatted)
                : 0,
            };
            logger.info("updating fields", updateData);

            const updatedAsset = await updateAssets(asset[0].id, updateData);
            if (_.isNull(updatedAsset)) {
              logger.error("error updating the data");
              return null;
            }
            logger.info(
              `update of asset successful for ${asset[0].id}`,
              updatedAsset
            );
          } else {
            logger.info("proper data not received to update", data);
          }
        }

        logger.info("waiting for 5 seconds");
        await sleep(5000);
        logger.info("wait is done");
      }
      if (unisatPromises.length === API_LIMIT || i == assets.length - 1) {
        const fetchedData = await Promise.all(unisatPromises);
        logger.info(
          "recieved a batch of fetched data from unisat",
          fetchedData
        );

        while (unisatPromises.length > 0) {
          unisatPromises.pop();
        }

        logger.info("updating the assets received from unisat");
        for (const data of fetchedData) {
          logger.info("updating asset for given data", data);
          if (_.isNull(data)) {
            continue;
          }
          const type = data.data.runeId ? AssetType.RUNE : "";
          if (type === AssetType.RUNE) {
            const runeData = data as TUnisatRunesMarketData;
            const asset = assets.filter(
              (asset) =>
                (asset.metadata as TRuneAssetMetadata).spacedName ===
                runeData.data.tick
            );
            logger.info("asset to be updated is", asset[0]);
            const updateData: Prisma.assetsUpdateInput = {
              unisatMarketData: runeData,
              unisatMarketPrice: Number(runeData.data.curPrice),
            };
            logger.info("updating fields", updateData);

            const updatedAsset = await updateAssets(asset[0].id, updateData);
            if (_.isNull(updatedAsset)) {
              logger.error("error updating the data");
              return null;
            }

            logger.info(
              `update of asset successful for ${asset[0].id}`,
              updatedAsset
            );
          } else {
            logger.info("proper data not received to update", data);
          }
        }

        logger.info("waiting for 5 seconds");
        await sleep(5000);
        logger.info("wait is done");
      }
    }
    logger.info("received and updated all assets info from external apis");
    return null;
  } catch (e) {
    logger.error("error updating assets for user", e);
    const custErr = ErrorCodes.GENERIC_ERROR("internal error");
    return {
      statusCode: custErr.statusCode,
      errorCode: custErr.errorCode,
      body: custErr.message,
    } as CustomErrorResp;
  }
};
