import { prisma } from "../../db/client";
import { Prisma } from "../../db/generated/client";
import { customLogger } from "../../logger/logger";

export const updateUser = async (id: string, data: Prisma.usersUpdateInput) => {
  const logger = customLogger("updateUser");

  try {
    const updatedUser = await prisma.users.update({
      where: {
        id: id,
      },
      data,
    });
    logger.info("succesfully updated user data", updateUser);
    return updatedUser;
  } catch (e) {
    logger.error("error updating data", e);
    return null;
  }
};
