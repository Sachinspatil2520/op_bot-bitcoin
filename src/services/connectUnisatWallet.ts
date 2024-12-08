import { fetchRunesRequest } from "../external/fetchRunes";
import { Bot, Context } from "grammy";
import { TRunesData, TUnisatWalletResponse } from "../common/types";
import { customLogger } from "../logger/logger";
import { assets, Prisma, users } from "../db/generated/client";
import { addUser } from "../repo/users/addUser";
import { addAssets } from "../repo/assets/addAssets";
import { getUserByChain } from "../repo/users/getUserByChain";
import { updateUser } from "../repo/users/updateUser";
import { getAssetsByIds } from "../repo/assets/getAssetsByIds";
import { addMultipleUserAssets } from "../repo/users_assets/addMultipleUserAssets";
import { deleteUserAssetsByWallet } from "../repo/users_assets/deleteUserAssetsByWallet";
import * as _ from "lodash";
import { AlertInterval, AssetType, Chain } from "../common/enums";
import { walletValidation } from "../external/walletValidation";
import { BotMessages, ErrorCodes } from "../common/constants";
import { updateBtcWalletAssets } from "./updateBtcWalletAssets";
import { updateUserMarketdata } from "./updateUserMarketdata";
import {
  sendTelegramMainMenu,
  sendTelegramMessage,
  sleep,
  sendTgMessage,
} from "../utils/utils";
import { CustomErrorResp } from "../common/interfaces";
import { updateFractalBtcWalletAssets } from "./updateFractalBtcWalletAssets";

export const connectUnisatWallet = async (payload: string, chain: Chain) => {
  const logger = customLogger("connectUnisatWallet");
  const data = payload.split("://");
  const userData = data[0].split(",");

  const tgId = userData[0];
  const userName = userData[1];
  logger.info("got wallet response for given user", tgId, userName);
  try {
    const respData = data[1].replace("response?", "").split("=");

    if (respData[0] === "error") {
      logger.info("user declined the connection request");
      const decodedError = Buffer.from(respData[1], "base64").toString("utf-8");
      logger.info("response recieved is: ", decodedError);

      sendTgMessage(tgId, BotMessages.WalletConnectionDeclinedMessage);
      return;
    }
    const decodedResp = JSON.parse(
      Buffer.from(respData[1], "base64").toString("utf-8")
    ) as TUnisatWalletResponse;
    logger.info("response recieved is: ", decodedResp);

    const address = decodedResp.address;
    logger.info("adding new wallet address", address, chain);

    if (chain === Chain.BITCOIN) {
      const presentUserData = await getUserByChain(tgId, Chain.BITCOIN);
      let fetchedUserData: users | null = null;

      if (_.isNull(presentUserData)) {
        logger.info("creating a new user");

        const walletAddresses: string[] = [];
        walletAddresses.push(address);

        const userData: Prisma.usersCreateInput = {
          telegramId: tgId,
          blockChain: Chain.BITCOIN,
          walletAddresses: walletAddresses,
          name: userName,
          password: "",
          config: {
            alert_interval: AlertInterval.HOUR6,
          },
        };

        logger.info("adding user to db", userData);

        const createdUser = await addUser(userData);
        if (_.isNull(createdUser)) {
          logger.error("error creating user on db");
          return;
        }

        logger.info("successfully added user to db", createdUser);

        fetchedUserData = createdUser;

        sendTgMessage(tgId, BotMessages.NewUserMessage);
      } else {
        logger.info("user already present in db");

        fetchedUserData = presentUserData;

        const walletExists = _.find(
          presentUserData.walletAddresses,
          (walletAddress) => {
            return walletAddress === address;
          }
        );
        if (!_.isUndefined(walletExists)) {
          logger.info("wallet address already present for user", walletExists);
          sendTgMessage(tgId, BotMessages.WalletExistsMessage);
        } else {
          const updatedWalletAddresses = presentUserData.walletAddresses;
          updatedWalletAddresses.push(address);

          const updatedData: Prisma.usersUpdateInput = {
            walletAddresses: updatedWalletAddresses,
          };

          const updatedUser = await updateUser(presentUserData.id, updatedData);
          if (updatedUser === null) {
            logger.error(
              "error adding new wallet address for the existing user"
            );
            return;
          }

          logger.info("added new wallet address to existing user", updatedUser);
        }
      }

      await sendTgMessage(tgId, BotMessages.WaitForUpdatingWalletMessage);

      const updateResp = await updateBtcWalletAssets(
        fetchedUserData.telegramId
      );
      if (!_.isNull(updateResp)) {
        logger.error("error updating the assets for user", userName);
        sendTelegramMessage(tgId, BotMessages.ErrorReplyMessage);
        return;
      }

      const marketDataResp = await updateUserMarketdata(fetchedUserData);
      if (!_.isNull(marketDataResp)) {
        logger.error("error updating the assets for user", userName);
        sendTelegramMessage(tgId, BotMessages.ErrorReplyMessage);
        return;
      }

      logger.info("updated all the assets", userName);
      sendTgMessage(tgId, BotMessages.WalletProcessedMessage);
    } else if (chain === Chain.FRACTAL_BITCOIN) {
      const presentUserData = await getUserByChain(tgId, Chain.FRACTAL_BITCOIN);
      let fetchedUserData: users | null = null;

      if (_.isNull(presentUserData)) {
        logger.info("creating a new user");

        const walletAddresses: string[] = [];
        walletAddresses.push(address);

        const userData: Prisma.usersCreateInput = {
          telegramId: tgId,
          blockChain: Chain.FRACTAL_BITCOIN,
          walletAddresses: walletAddresses,
          name: userName,
          password: "",
          config: {
            alert_interval: AlertInterval.HOUR6,
          },
        };

        logger.info("adding user to db", userData);

        const createdUser = await addUser(userData);
        if (_.isNull(createdUser)) {
          logger.error("error creating user on db");
          return;
        }

        logger.info("successfully added user to db", createdUser);

        fetchedUserData = createdUser;

        sendTgMessage(tgId, BotMessages.NewUserMessage);
      } else {
        logger.info("user already present in db");

        fetchedUserData = presentUserData;

        const walletExists = _.find(
          presentUserData.walletAddresses,
          (walletAddress) => {
            return walletAddress === address;
          }
        );
        if (!_.isUndefined(walletExists)) {
          logger.info("wallet address already present for user", walletExists);
          sendTgMessage(tgId, BotMessages.WalletExistsMessage);
        } else {
          const updatedWalletAddresses = presentUserData.walletAddresses;
          updatedWalletAddresses.push(address);

          const updatedData: Prisma.usersUpdateInput = {
            walletAddresses: updatedWalletAddresses,
          };

          const updatedUser = await updateUser(presentUserData.id, updatedData);
          if (updatedUser === null) {
            logger.error(
              "error adding new wallet address for the existing user"
            );
            return;
          }

          logger.info("added new wallet address to existing user", updatedUser);
        }
      }

      await sendTgMessage(tgId, BotMessages.WaitForUpdatingWalletMessage);

      const updateResp = await updateFractalBtcWalletAssets(
        fetchedUserData.telegramId
      );
      if (!_.isNull(updateResp)) {
        logger.error("error updating the assets for user", userName);
        sendTelegramMessage(tgId, BotMessages.ErrorReplyMessage);
        return;
      }

      logger.info("updated all the assets", userName);
      sendTgMessage(tgId, BotMessages.WalletProcessedMessage);
    }

    await sleep(2000);
    await sendTelegramMainMenu(tgId);
    return;
  } catch (e) {
    logger.error("error adding wallet address", e);
    sendTelegramMessage(tgId, BotMessages.ErrorReplyMessage);
    return;
  }
};
