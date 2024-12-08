import { prisma } from "../../db/client";
import { customLogger } from "../../logger/logger";

export const getUserAssets = async (
  assetId: string,
  userId: string,
  walletAddress: string
) => {
  const logger = customLogger("getUserAssets");
  try {
    logger.info("getting user_asset data for ", {
      userId: userId,
      assetId: assetId,
    });
    const userAssetsData = await prisma.users_assets.findUnique({
      where: {
        userId_assetId_walletAddress: {
          userId: userId,
          assetId: assetId,
          walletAddress: walletAddress,
        },
      },
    });
    logger.info(`received data for userId_assetId: ${userId}_${assetId}`);
    return userAssetsData;
  } catch (e) {
    logger.error("error getting user_asset data", e);
    return null;
  }
};
