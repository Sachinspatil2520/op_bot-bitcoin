import { Context } from "grammy";
import { customLogger } from "../logger/logger";
import { BotMessages } from "../common/constants";
import { getUserByTgId } from "../repo/users/getUserByTgId";
import { getAssetsByUser } from "./getAssetsByUser";
import { fetchBtcPrices } from "../external/fetchBtcPrices";
import * as _ from "lodash";
import Handlebars from "handlebars";
import { AssetType, Chain } from "../common/enums";
import {
  IBtcOverallWalletSummary,
  IBtcWalletSummary,
} from "../common/interfaces";
import {
  createMarkupForOverallSummary,
  createMarkupForWalletSummary,
  sendTelegramMessage,
} from "../utils/utils";
import { getUserAssetsByWallet } from "../repo/users_assets/getUserAssetsByWallet";
import { getUserAssetsByUserId } from "../repo/users_assets/getUserAssetsByUserId";
import { getAllAssetsByIds } from "../repo/assets/getAllAssetsByIds";
import { updateBtcWalletAssets } from "./updateBtcWalletAssets";
import { getUserByChain } from "../repo/users/getUserByChain";

export const getOverallPortfolioSummary = async (ctx: Context) => {
  const logger = customLogger("getOverallPortfolioSummary");
  const telegramId = ctx.from ? ctx.from.id : "";
  try {
    logger.info("getting user info", telegramId);

    const user = await getUserByChain(telegramId.toString(), Chain.BITCOIN);
    if (_.isNull(user)) {
      logger.error("error getting user info");
      ctx.reply(BotMessages.ErrorReplyMessage);
      return;
    }

    logger.info("successfully got user info", user);

    logger.info("updating assets for the user", user.name);

    ctx.reply(BotMessages.WaitForUpdatingWalletMessage);

    const updateUserAssets = await updateBtcWalletAssets(user.telegramId);
    if (!_.isNull(updateUserAssets)) {
      logger.error("error updating user assets", updateUserAssets);
      ctx.reply(BotMessages.ErrorReplyMessage);
      return;
    }

    logger.info("successfully updated user assets and their balance");

    const userAssetsData = await getUserAssetsByUserId(user.id);
    if (_.isNull(userAssetsData)) {
      logger.error("error getting users_assets data");
      ctx.reply(BotMessages.ErrorReplyMessage);
      return;
    }

    logger.info("successfully got users_assets data for user", user.id);

    logger.info("getting wallets from these users_assets data");

    const wallets = userAssetsData.map((userasset) => {
      return userasset.walletAddress;
    });

    const uniqueWallets = Array.from(new Set(wallets));

    const assetIds: string[] = userAssetsData.map((uadata) => {
      return uadata.assetId;
    });

    logger.info("got all the asset ids for the user", user.id);

    logger.info("getting all asset infos for the user", user.id);

    const assets = await getAllAssetsByIds(assetIds);
    if (_.isNull(assets)) {
      logger.error("error getting all the assets for user", user.id);
      return null;
    }

    logger.info("received all the assets info for user", user.id, assets);

    const btcPrices = await fetchBtcPrices();
    if (_.isNull(btcPrices)) {
      logger.error("error getting btc prices");
      return;
    }

    logger.info("successfully received btc prices", btcPrices);

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
          const userAssetEntry = userAssetsData.filter(
            (userasset) => userasset.assetId === asset.assetId
          );

          const amountOfRune = userAssetEntry.reduce(
            (acc, cur) => acc + cur.balance,
            0
          );
          logger.info(
            `calculating assets value using price: ${price} and rune balance: ${amountOfRune}`,
            userAssetEntry.length,
            asset.assetId
          );
          const totalAssetValue = price * amountOfRune;
          totalAssetsValue.push(totalAssetValue);
          totalRunesValue.push(totalAssetValue);
          break;
        }
      }
    }

    const totalAssetPrice = totalAssetsValue.reduce(
      (acc, curVal) => acc + curVal,
      0
    );
    logger.info("total value of assets held by user is ", totalAssetPrice);

    const totalRunePrice = totalRunesValue.reduce(
      (acc, curVal) => acc + curVal,
      0
    );
    logger.info("total runes value held by user are: ", totalRunePrice);

    const totalAssetsPriceInBtc = totalAssetPrice * 1e-8;
    logger.info("total assets value in btc is :", totalAssetsPriceInBtc);

    const totalAssetsPriceInUsd = totalAssetsPriceInBtc * btcPrices.USD;
    logger.info("total assets value in USD is: ", totalAssetsPriceInUsd);

    const totalRunePercentage =
      totalAssetPrice !== 0 ? (totalRunePrice / totalAssetPrice) * 100 : 0;

    const overallSummary: IBtcOverallWalletSummary = {
      totalAssets: totalAssetsValue.length,
      totalValueInBtc: parseFloat(totalAssetsPriceInBtc.toFixed(8)),
      totalValueInUsd: parseFloat(
        totalAssetsPriceInUsd.toFixed(2)
      ).toLocaleString("en-US"),
      runesPercentage: totalRunePercentage,
      totalWallets: uniqueWallets.length,
    };

    const text = await createMarkupForOverallSummary(overallSummary);
    const msg = "Your portfolio Summary is: \n";

    await sendTelegramMessage(user.telegramId, msg + text);
    logger.info("sent reply to user with portfolio summary", overallSummary);
    return;
  } catch (e) {
    logger.error("error getting overall portfolio summary");
    ctx.reply(BotMessages.ErrorReplyMessage);
    return;
  }
};
