import { prisma } from "../../db/client";
import { customLogger } from "../../logger/logger";

export const deleteUserAssetsByWallet = async (
  userId: string,
  wallet: string
) => {
  const logger = customLogger("deleteUserAssetsByWallet");
  try {
    logger.info("deleting user_assets for wallet address: ", wallet);

    const deletedUserAssets = await prisma.users_assets.deleteMany({
      where: {
        walletAddress: wallet,
        userId: userId,
      },
    });

    logger.info("deleted all user_assets for wallet address", wallet);
    return deletedUserAssets;
  } catch (e) {
    logger.error("error deleting in users_assets", e);
    return null;
  }
};
