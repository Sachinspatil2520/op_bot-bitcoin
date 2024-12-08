import { Context } from "grammy";
import { TRunesData } from "../common/types";
import { customLogger } from "../logger/logger";
import { assets, Prisma, users } from "../db/generated/client";
import { addUser } from "../repo/users/addUser";
import { addAssets } from "../repo/assets/addAssets";
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
import { getUserByChain } from "../repo/users/getUserByChain";
import { updateFractalBtcWalletAssets } from "./updateFractalBtcWalletAssets";

export const addFractalBitcoinWallet = async (ctx: Context) => {
  const logger = customLogger("addFractalBitcoinWallet");

  try {
    const address: string = ctx.message?.text || "";
    logger.info("adding fractal bitcoin wallet service for address", address);

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

    logger.info("checking if it is a valid fractal bitcoin address");

    const validationResp = await walletValidation(address);
    if (_.isNull(validationResp)) {
      logger.error("error validating the address");
      ctx.reply(BotMessages.ErrorReplyMessage);
      return;
    }

    if (!validationResp.isvalid) {
      logger.info("Address is not valid");
      ctx.reply(BotMessages.InvalidAddressMessage);
      ctx.reply(BotMessages.AddFBtcWallet, {
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
      Chain.FRACTAL_BITCOIN
    );
    let fetchedUserData: users | null = null;

    if (_.isNull(presentUserData)) {
      logger.info("creating a new user");

      const walletAddresses: string[] = [];
      walletAddresses.push(address);

      const userData: Prisma.usersCreateInput = {
        telegramId: user.id.toString(),
        blockChain: Chain.FRACTAL_BITCOIN,
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

    const updateResp = await updateFractalBtcWalletAssets(
      fetchedUserData.telegramId
    );
    if (!_.isNull(updateResp)) {
      logger.error("error updating the assets for user", user.username);
      ctx.reply(BotMessages.ErrorReplyMessage);
      return;
    }

    ctx.reply(BotMessages.WalletProcessedMessage);
  } catch (e) {
    logger.error("error adding new fractal wallet", e);
    return;
  }
};
