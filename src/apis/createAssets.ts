import { customLogger } from "../logger/logger";
import { CustomErrorResp, ICreateAssetsPayload } from "../common/interfaces";
import { magicEdenFetchRunesMarketData } from "../external/magicEdenFetchRunesMarketData";
import * as _ from "lodash";
import { AssetType } from "../common/enums";
import { HttpStatusCode } from "axios";
import { Prisma } from "../db/generated/client";
import { addAssets } from "../repo/assets/addAssets";
import { ErrorCodes } from "../common/constants";

export const createAssets = async (payload: ICreateAssetsPayload) => {
  const logger = customLogger("createAssets");
  try {
    logger.info("creating assets", payload);

    const assets: Prisma.assetsCreateManyInput[] = [];
    for (const id of payload.ids) {
      const asset: Prisma.assetsCreateManyInput = {
        assetId: id.assetId,
        type: payload.type,
        blockchain: payload.blockchain,
        name: id.spacedName || "",
        collectionName: payload.collectionName || "",
        metadata: {
          spacedName: id.spacedName || "",
        },
        symbol: "",
        price: 0,
        unisatMarketData: {},
        unisatMarketPrice: 0,
        magicedenMarketData: {},
        magicedenMarketPrice: 0,
      };
      logger.info("asset input created", asset);
      assets.push(asset);
    }
    logger.info("creating all the assets", assets.length);
    const assetsAdded = await addAssets(assets);
    if (_.isNull(assetsAdded)) {
      logger.error("error creating assets");
      const err = ErrorCodes.GENERIC_ERROR("error creating assets");
      return {
        errorCode: err.errorCode,
        statusCode: err.statusCode,
        body: err.message,
      } as CustomErrorResp;
    }

    logger.info(`successfully created ${assetsAdded.count} assets in db`);
    return null;
  } catch (e) {
    logger.error("error creating assets");
    return {
      errorCode: "",
      statusCode: HttpStatusCode.InternalServerError,
      body: "internal error",
    } as CustomErrorResp;
  }
};
