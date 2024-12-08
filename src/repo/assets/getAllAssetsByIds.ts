import { AssetType } from "../../common/enums";
import { prisma } from "../../db/client";
import { customLogger } from "../../logger/logger";

export const getAllAssetsByIds = async (ids: string[]) => {
  const logger = customLogger("getAssetsByIds");
  try {
    logger.info("getting all assets", ids);

    const allAssets = await prisma.assets.findMany({
      where: {
        assetId: {
          in: ids,
        },
      },
    });
    logger.info(`got all assets for ids`, ids);
    return allAssets;
  } catch (e) {
    logger.info("error getting runes for given ids", e);
    return null;
  }
};
