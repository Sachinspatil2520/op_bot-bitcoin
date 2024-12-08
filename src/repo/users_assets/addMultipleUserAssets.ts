import { prisma } from "../../db/client";
import { Prisma } from "../../db/generated/client";
import { customLogger } from "../../logger/logger";

export const addMultipleUserAssets = async (
  data: Prisma.users_assetsCreateManyInput[]
) => {
  const logger = customLogger("addUserAssets");
  try {
    logger.info("adding all data to user_assets");
    const addedUserAssets = await prisma.users_assets.createMany({
      data,
    });
    logger.info("added all data to user_assets", addedUserAssets.count);
    return addedUserAssets;
  } catch (e) {
    logger.error("error adding data to users_assets", e);
    return null;
  }
};
