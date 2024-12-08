import _ from "lodash";
import { AssetType } from "../../common/enums";
import { prisma } from "../../db/client";
import { customLogger } from "../../logger/logger";
import { assets } from "../../db/generated/client";

export const getAssetById = async (type: AssetType, assetId: string) => {
  const logger = customLogger("getAssetById");
  try {
    logger.info("getting asset of given type and id", type, assetId);

    const asset = await prisma.assets.findFirst({
      where: {
        type: type,
        assetId: assetId,
      },
    });
    if (_.isNull(asset)) {
      logger.info("no asset of the given id found: ", assetId);
      return {};
    }
    logger.info(`got ${type} asset for id ${assetId}`);
    return asset as assets;
  } catch (e) {
    logger.info("error getting runes for given ids", e);
    return null;
  }
};
