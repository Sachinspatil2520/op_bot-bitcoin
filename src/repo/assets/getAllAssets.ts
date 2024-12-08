import { prisma } from "../../db/client";
import { customLogger } from "../../logger/logger";
import * as _ from "lodash";

export const getAllAssets = async () => {
  const logger = customLogger("getAllAssets");
  try {
    logger.info("getting all the assets from db");
    const assets = await prisma.assets.findMany();
    if (_.isEmpty(assets)) {
      logger.info("no assets found");
      return null;
    }
    logger.info("successfully found all the assests");
    return assets;
  } catch (e) {
    logger.error("error getting all the assets", e);
    return null;
  }
};
