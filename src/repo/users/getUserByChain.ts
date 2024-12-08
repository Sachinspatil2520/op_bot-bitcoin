import _ from "lodash";
import { AssetType, Chain } from "../../common/enums";
import { prisma } from "../../db/client";
import { customLogger } from "../../logger/logger";

export const getUserByChain = async (telegramId: string, chain: Chain) => {
  const logger = customLogger("getUserByChain");
  try {
    logger.info(`Getting user by tg id: ${telegramId} and chain: ${chain}`);
    const user = await prisma.users.findFirst({
      where: {
        telegramId: telegramId,
        blockChain: chain,
      },
    });
    return user;
  } catch (e) {
    logger.error(`Error getting users by tg id`, e);
    return null;
  }
};
