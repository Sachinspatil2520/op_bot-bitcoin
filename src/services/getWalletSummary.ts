import { Context } from "grammy";
import { customLogger } from "../logger/logger";
import { BotMessages } from "../common/constants";
import { getUserByTgId } from "../repo/users/getUserByTgId";
import {
  CustomErrorResp,
  IAlertResponse,
  IAssetAlert,
  IUserConfig,
  IBtcWalletSummary,
} from "../common/interfaces";
import { getUserAssetsByWallet } from "../repo/users_assets/getUserAssetsByWallet";
import { getAllAssetsByIds } from "../repo/assets/getAllAssetsByIds";
import { getAssetsByUser } from "./getAssetsByUser";
import _ from "lodash";
import { AssetType, Chain } from "../common/enums";
import { fetchBtcPrices } from "../external/fetchBtcPrices";
import { updateBtcWalletAssets } from "./updateBtcWalletAssets";
import { log } from "console";
import Handlebars from "handlebars";
import {
  createMarkupForWalletSummary,
  sendTelegramMessage,
} from "../utils/utils";
import { getUserByChain } from "../repo/users/getUserByChain";

export const getWalletSummary = async (ctx: Context) => {
  const logger = customLogger("getWalletSummary");
  const telegramId = ctx.from ? ctx.from.id : "";
  try {
    logger.info("getting user info", telegramId);

    const user = await getUserByChain(
      telegramId.toString(),
      Chain.FRACTAL_BITCOIN
    );
    if (_.isNull(user)) {
      logger.error("error getting user info");
      ctx.reply(BotMessages.ErrorReplyMessage);
      return;
    }

    logger.info("successfully got user info", user);

    const btcPrices = await fetchBtcPrices();
    if (_.isNull(btcPrices)) {
      logger.error("error getting btc prices");
      return;
    }

    logger.info("successfully received btc prices", btcPrices);

    logger.info("updating assets for the user", user.name);

    ctx.reply(BotMessages.WaitForUpdatingWalletMessage);

    // const updateUserAssets = await updateBtcWalletAssets(user.telegramId);
    // if (!_.isNull(updateUserAssets)) {
    //   logger.error("error updating user assets", updateUserAssets);
    //   ctx.reply(BotMessages.ErrorReplyMessage);
    //   return;
    // }

    logger.info("successfully updated user assets and their balance");

    for (const wallet of user.walletAddresses) {
      logger.info("evaluating assets for wallet", wallet);

      const userAssetsData = await getUserAssetsByWallet(user.id, wallet);
      if (_.isNull(userAssetsData)) {
        logger.error("error getting user assets data for wallet", wallet);
        ctx.reply(BotMessages.ErrorReplyMessage);
        return;
      }

      logger.info("successfully got user assets data for wallet", wallet);

      const assetIds: string[] = userAssetsData.map((uadata) => {
        return uadata.assetId;
      });

      logger.info("got all the asset ids for the user", user.id);

      logger.info("getting all asset infos for the user", user.id);

      const assets = await getAllAssetsByIds(assetIds);
      if (_.isNull(assets)) {
        logger.error("error getting all the assets for wallet", user.id);
        return null;
      }

      logger.info("received all the assets info for wallet", wallet, assets);

      const totalAssetsValue: number[] = [];
      const totalRunesValue: number[] = [];

      for (const asset of assets) {
        const type = asset.type;
        logger.info("evaluating asset", asset.assetId);
        switch (type) {
          case AssetType.RUNE: {
            logger.info("asset is of type " + AssetType.RUNE);
            const price =
              asset.magicedenMarketPrice > asset.unisatMarketPrice
                ? asset.magicedenMarketPrice
                : asset.unisatMarketPrice;
            const amountOfRune = userAssetsData.filter(
              (userasset) => userasset.assetId === asset.assetId
            );
            logger.info(
              `calculating assets value using price: ${price} and rune balance: ${amountOfRune[0].balance}`
            );
            const totalAssetValue = price * amountOfRune[0].balance;
            totalAssetsValue.push(totalAssetValue);
            totalRunesValue.push(totalAssetValue);
            break;
          }
        }
      }
      logger.info("received prices for all the assets for wallet", wallet);

      const totalAssetValue = totalAssetsValue.reduce(
        (acc, curVal) => acc + curVal,
        0
      );
      logger.info("total value of assets", totalAssetValue);

      const totalRuneValue = totalRunesValue.reduce(
        (acc, curVal) => acc + curVal,
        0
      );
      logger.info("total value of runes", totalRuneValue);

      const runesPercentage =
        totalAssetValue !== 0 ? (totalRuneValue / totalAssetValue) * 100 : 0;
      logger.info("percentage of runes", runesPercentage);

      const totalAssetValueInBtc = totalAssetValue * 1e-8;
      logger.info("total assets in btc", totalAssetValueInBtc);

      const totalAssetValueInUsd = totalAssetValueInBtc * btcPrices.USD;

      const walletSummary: IBtcWalletSummary = {
        totalAssets: assets.length,
        totalValueInBtc: parseFloat(totalAssetValueInBtc.toFixed(8)),
        totalValueInUsd: parseFloat(
          totalAssetValueInUsd.toFixed(2)
        ).toLocaleString("en-US"),
        runesPercentage: runesPercentage,
      };

      logger.info("wallet summary for the given wallet is", walletSummary);

      const msg1 = `👉 Your portfolio for wallet \`${wallet}\`:\n`;

      const text = await createMarkupForWalletSummary(walletSummary);

      await sendTelegramMessage(user.telegramId, msg1 + text);

      logger.info("sent wallet summary for wallet" + wallet);
    }
    logger.info("sent all the wallets summary for the user", user.id);
    return;
  } catch (e) {
    logger.error("error getting wallet summary");
    ctx.reply(BotMessages.ErrorReplyMessage);
    return;
  }
};
