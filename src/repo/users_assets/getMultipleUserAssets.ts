import { prisma } from "../../db/client";
import { customLogger } from "../../logger/logger";

export const getUserAssets = async (assetIds: string[], userId: string) => {
  const logger = customLogger("getUserAssets");
  try {
    logger.info("getting user_asset data for ", {
      userId: userId,
      assetId: assetIds,
    });
    const userAssetsData = await prisma.users_assets.findMany({
      where: {
        userId: userId,
        assetId: {
          in: assetIds,
        },
      },
    });
    logger.info(
      `received data for given userId : ${userId} and assetIds : ${assetIds}`
    );
    return userAssetsData;
  } catch (e) {
    logger.error("error getting user_asset data", e);
    return null;
  }
};
