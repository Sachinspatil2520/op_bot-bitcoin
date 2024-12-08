import { prisma } from "../../db/client";
import { customLogger } from "../../logger/logger";

export const getUserAssetsByUserId = async (userId: string) => {
  const logger = customLogger("getUserAssetsByUserId");
  try {
    logger.info("getting user_asset data for ", {
      userId: userId,
    });
    const userAssetsData = await prisma.users_assets.findMany({
      where: {
        userId: userId,
      },
    });
    logger.info(`received data for given user id: ${userId}`, userAssetsData);
    return userAssetsData;
  } catch (e) {
    logger.error("error getting user_asset data", e);
    return null;
  }
};
