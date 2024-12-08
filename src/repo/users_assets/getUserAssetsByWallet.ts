import { prisma } from "../../db/client";
import { customLogger } from "../../logger/logger";

export const getUserAssetsByWallet = async (
  userId: string,
  walletAddress: string
) => {
  const logger = customLogger("getUserAssets");
  try {
    logger.info("getting user_asset data for ", walletAddress);
    const userAssetsData = await prisma.users_assets.findMany({
      where: {
        userId: userId,
        walletAddress: walletAddress,
      },
    });
    logger.info(`received data for wallet address`, walletAddress);
    return userAssetsData;
  } catch (e) {
    logger.error("error getting user_asset data", e);
    return null;
  }
};
