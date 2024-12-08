import { prisma } from "../../db/client";
import { Prisma } from "../../db/generated/client";
import { customLogger } from "../../logger/logger";

export const addUserAssets = (data: Prisma.users_assetsCreateInput) => {
  const logger = customLogger("addUserAssets");
  try {
    logger.info("adding data to user_assets");
    const addedUserAssets = prisma.users_assets.create({
      data,
    });
    logger.info("added data to user_assets");
    return addedUserAssets;
  } catch (e) {
    logger.error("error adding data to users_assets");
    return null;
  }
};
