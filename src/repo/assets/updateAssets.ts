import { prisma } from "../../db/client";
import { Prisma } from "../../db/generated/client";
import { customLogger } from "../../logger/logger";

export const updateAssets = async (
  id: string,
  data: Prisma.assetsUpdateInput
) => {
  const logger = customLogger("updateAssets");
  try {
    logger.info("updating assets with data", data);
    const updatedAssets = await prisma.assets.update({
      where: {
        id: id,
      },
      data,
    });
    logger.info("successfully updated assets", updatedAssets);
    return updatedAssets;
  } catch (e) {
    logger.error("error updating assets", e);
    return null;
  }
};
