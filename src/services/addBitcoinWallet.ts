import { fetchRunesRequest } from "../external/fetchRunes";
import { Bot, Context } from "grammy";
import { TRunesData } from "../common/types";
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
import { BotMessages } from "../common/constants";
import { updateBtcWalletAssets } from "./updateBtcWalletAssets";
import { updateUserMarketdata } from "./updateUserMarketdata";

// TODO: add username instead of display name to db
// TODO: check if user is present on start and display only add wallet option if user is not present in db

export const addBitcoinWallet = async (ctx: Context) => {
  const logger = customLogger("addBitcoinWallet");
  logger.info("got request to add bitcoin wallet", {
    message: ctx.message?.text,
  });
  const address: string = ctx.message?.text || "";

  if (address === "") {
    logger.info("no address found");
    ctx.reply(BotMessages.AddBtcWalletMessage, {
      reply_markup: {
        force_reply: true,
        input_field_placeholder: "Enter address here: ",
      },
    });
    return;
  }

  try {
    logger.debug("address received is : ", address);

    logger.info("checking if it is a valid bitcoin address");

    const validationResp = await walletValidation(address);
    if (_.isNull(validationResp)) {
      logger.error("error validating the address");
      ctx.reply(BotMessages.ErrorReplyMessage);
      return;
    }

    if (!validationResp.isvalid) {
      logger.info("Address is not valid");
      ctx.reply(BotMessages.InvalidAddressMessage);
      ctx.reply(BotMessages.AddBtcWalletMessage, {
        reply_markup: {
          force_reply: true,
          input_field_placeholder: "Enter address here: ",
        },
      });
      return;
    }

    const user = ctx.message?.from;

    if (user === undefined) {
      logger.warn("no user information found");
      return;
    }

    const presentUserData = await getUserByChain(
      user.id.toString(),
      Chain.BITCOIN
    );
    let fetchedUserData: users | null = null;

    if (_.isNull(presentUserData)) {
      logger.info("creating a new user");

      const walletAddresses: string[] = [];
      walletAddresses.push(address);

      const userData: Prisma.usersCreateInput = {
        telegramId: user.id.toString(),
        blockChain: Chain.BITCOIN,
        walletAddresses: walletAddresses,
        name: user.username,
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

      ctx.reply(BotMessages.NewUserMessage);
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
        ctx.reply(BotMessages.WalletExistsMessage);
      } else {
        const updatedWalletAddresses = presentUserData.walletAddresses;
        updatedWalletAddresses.push(address);

        const updatedData: Prisma.usersUpdateInput = {
          walletAddresses: updatedWalletAddresses,
        };

        const updatedUser = await updateUser(presentUserData.id, updatedData);
        if (updatedUser === null) {
          logger.error("error adding new wallet address for the existing user");
          return;
        }

        logger.info("added new wallet address to existing user", updatedUser);
      }
    }

    await ctx.reply(BotMessages.WaitForUpdatingWalletMessage);

    const updateResp = await updateBtcWalletAssets(fetchedUserData.telegramId);
    if (!_.isNull(updateResp)) {
      logger.error("error updating the assets for user", user.username);
      ctx.reply(BotMessages.ErrorReplyMessage);
      return;
    }

    const marketDataResp = await updateUserMarketdata(fetchedUserData);
    if (!_.isNull(marketDataResp)) {
      logger.error("error updating the assets for user", user.username);
      ctx.reply(BotMessages.ErrorReplyMessage);
      return;
    }

    ctx.reply(BotMessages.WalletProcessedMessage);
  } catch (e) {
    logger.error("error adding wallet address", e);
    ctx.reply(BotMessages.ErrorReplyMessage);
    return;
  }
};
