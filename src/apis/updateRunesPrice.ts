import { AssetType, TimeType } from "../common/enums";
import { customLogger } from "../logger/logger";
import { getAssetsByType } from "../repo/assets/getAssetsByType";
import { magicEdenFetchRunesMarketData } from "../external/magicEdenFetchRunesMarketData";
import * as _ from "lodash";
import { formToJSON, HttpStatusCode } from "axios";
import { Prisma } from "../db/generated/client";
import { updateAssets } from "../repo/assets/updateAssets";
import { TRuneAssetMetadata, TUnisatRunesMarketData } from "../common/types";
import { getAllAssets } from "../repo/assets/getAllAssets";
import { CustomErrorResp } from "../common/interfaces";
import { API_LIMIT, ErrorCodes } from "../common/constants";
import { AnyARecord } from "dns";
import { unisatFetchRunesMarketData } from "../external/unisatFetchRunesMarketData";
import { TMagicEdenRunesMarketData } from "../common/types";
import { sleep } from "../utils/utils";

export const updateRunesPrice = async () => {
  const logger = customLogger("updateRunesPrice");
  try {
    logger.info("got request for updating the runes");

    const assets = await getAllAssets();
    if (_.isNull(assets)) {
      logger.error("error getting the rune assets");
      return;
    }
    if (assets.length === 0) {
      logger.info("no rune assets found in db");
      return;
    }

    logger.info("runes assets found", _.size(assets));

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
  } catch (e) {
    logger.error("error updating assets", e);
    const custErr = ErrorCodes.GENERIC_ERROR();
    return {
      statusCode: custErr.statusCode,
      errorCode: custErr.errorCode,
      body: custErr.message,
    } as CustomErrorResp;
  }
};
