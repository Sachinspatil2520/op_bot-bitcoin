import { AssetType } from "../../common/enums";
import { prisma } from "../../db/client";
import { Prisma } from "../../db/generated/client";
import { customLogger } from "../../logger/logger";

export const getAssetsByType = async (assetType: AssetType) => {
  const logger = customLogger("getAssetByType");
  try {
    logger.info(`Getting assets by type: ${assetType}`);
    const assets = await prisma.assets.findMany({
      where: { type: assetType },
    });
    logger.info(`Found ${assets.length} assets`);
    return assets;
  } catch (e) {
    logger.error(`Error getting assets by type: ${assetType}`, e);
    return [];
  }
};
