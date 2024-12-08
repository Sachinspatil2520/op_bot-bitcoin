import { AssetType } from "../../common/enums";
import { prisma } from "../../db/client";
import { customLogger } from "../../logger/logger";

export const getAssetsByIds = async (type: AssetType, ids: string[]) => {
  const logger = customLogger("getAssetsByIds");
  try {
    logger.info("getting all assets", type, ids);

    const allAssets = await prisma.assets.findMany({
      where: {
        type: type,
        assetId: {
          in: ids,
        },
      },
    });
    logger.info(`got all ${type} assets for ids`, ids);
    return allAssets;
  } catch (e) {
    logger.info("error getting runes for given ids", e);
    return null;
  }
};
