import _ from "lodash";
import { customLogger } from "../logger/logger";
import { getAllUsers } from "../repo/users/getAllUsers";
import { updateBtcWalletAssets } from "./updateBtcWalletAssets";
import { Chain } from "../common/enums";
import { updateFractalBtcWalletAssets } from "./updateFractalBtcWalletAssets";

export const updateAllWallets = async () => {
  const logger = customLogger("updateAllWallets");
  try {
    logger.info("updating all the wallet assets");

    const users = await getAllUsers();
    if (_.isNull(users)) {
      logger.error("no users received");
      return;
    }

    logger.info("all users received");
    for (const user of users) {
      logger.info("updating wallets of user", user.name);

      if (user.blockChain === Chain.BITCOIN) {
        logger.info("updating btc wallet of user", user.name);

        const updateResp = await updateBtcWalletAssets(user.telegramId);
        if (!_.isNull(updateResp)) {
          logger.error("error updating wallets of user", user.name, updateResp);
          continue;
        }

        logger.info("successfully updated btc wallets of user", user.name);
      } else if (user.blockChain === Chain.FRACTAL_BITCOIN) {
        logger.info("updating fractal btc wallet of user", user.name);

        const updateResp = await updateFractalBtcWalletAssets(user.telegramId);
        if (!_.isNull(updateResp)) {
          logger.error("error updating wallets of user", user.name, updateResp);
          continue;
        }

        logger.info("successfully updated fractal wallets of user", user.name);
      }
      logger.info("updated all the wallets of user", user.name);
    }
    logger.info(`successfully updated all the wallets of all the users`);
    return;
  } catch (e) {
    logger.error("error updating all the assets");
    return;
  }
};
