import { prisma } from "../../db/client";
import { Prisma } from "../../db/generated/client";
import { customLogger } from "../../logger/logger";

export const deleteUserAssetsById = async (
  userId: string,
  assetIds: string[]
) => {
  const logger = customLogger("deleteuserAssets");
  try {
    logger.info("deleting all asstes for ", {
      userId: userId,
      assetIds: assetIds,
    });

    const deletedUserAssets = await prisma.users_assets.deleteMany({
      where: {
        userId: userId,
        assetId: {
          in: assetIds,
        },
      },
    });
    logger.info(
      "successfully deleted all user_assets data for given ids",
      assetIds
    );
    return deletedUserAssets;
  } catch (e) {
    logger.error("error deleting all data in user_assets");
    return null;
  }
};
