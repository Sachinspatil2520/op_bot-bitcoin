import _, { StringChain } from "lodash";
import { AssetType, Chain } from "../../common/enums";
import { prisma } from "../../db/client";
import { customLogger } from "../../logger/logger";

export const getUserByTgId = async (telegramId: string) => {
  const logger = customLogger("getUserByTgId");
  try {
    logger.info(`Getting user by tg id: ${telegramId}`);
    const user = await prisma.users.findMany({
      where: {
        telegramId: telegramId,
      },
    });
    return user;
  } catch (e) {
    logger.error(`Error getting users by tg id`, e);
    return null;
  }
};
