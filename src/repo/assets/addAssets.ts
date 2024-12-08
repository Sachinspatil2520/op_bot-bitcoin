import { error } from "console";
import { prisma } from "../../db/client";
import { Prisma } from "../../db/generated/client";
import { customLogger } from "../../logger/logger";

export const addAssets = async (data: Prisma.assetsCreateManyInput[]) => {
  const logger = customLogger("addAsset");
  try {
    logger.info("adding asset to db", { data: data });
    const createdAssets = await prisma.assets.createMany({
      data,
    });
    logger.info("created assets", createdAssets);
    return createdAssets;
  } catch (e) {
    logger.error("error adding assets to db: ", e);
    return null;
  }
};
