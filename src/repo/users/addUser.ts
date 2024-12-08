import { AssetType } from "../../common/enums";
import { prisma } from "../../db/client";
import { customLogger } from "../../logger/logger";
import { Prisma } from "../../db/generated/client";

export const addUser = async (data: Prisma.usersCreateInput) => {
  const logger = customLogger("addUser");
  try {
    logger.info(`adding user`, { data });
    const createdUser = await prisma.users.create({
      data,
    });
    logger.info(`created user`, { createdUser });
    return createdUser;
  } catch (e) {
    logger.error(`Error creating user`, { e });
    return null;
  }
};
