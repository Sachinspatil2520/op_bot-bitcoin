import { HttpStatusCode } from "axios";
import {
  AlertInterval,
  AssetType,
  Chain,
  MarketPlaceName,
} from "../common/enums";
import {
  CustomErrorResp,
  IAlertResponse,
  IAssetAlert,
  IUserConfig,
} from "../common/interfaces";
import { customLogger } from "../logger/logger";
import { getUsersByAlertInterval } from "../repo/users/getUsersByAlertInterval";
import { getUserAssetsByWallet } from "../repo/users_assets/getUserAssetsByWallet";
import * as _ from "lodash";
import { getAllAssetsByIds } from "../repo/assets/getAllAssetsByIds";
import { updateBtcWalletAssets } from "../services/updateBtcWalletAssets";
import {
  TMagicEdenRunesMarketData,
  TRuneAssetMetadata,
  TUnisatRunesMarketData,
} from "../common/types";
import { Prisma } from "../db/generated/client";
import { sendTelegramMessage, createMarkupTextFromResp } from "../utils/utils";
import { getUserByTgId } from "../repo/users/getUserByTgId";
import { Bot, Context } from "grammy";
import { BotMessages } from "../common/constants";
import { fetchBtcPrices } from "../external/fetchBtcPrices";
import { getUserByChain } from "../repo/users/getUserByChain";

export const sendAlertToUser = async (ctx: Context) => {
  const logger = customLogger("sendAlertToUser");
  const telegramId = ctx.from ? ctx.from.id : "";
  try {
    logger.info("getting user info", telegramId);

    const users = await getUserByTgId(telegramId.toString());
    if (_.isNull(users)) {
      logger.error("error getting user info");
      ctx.reply(BotMessages.ErrorReplyMessage);
      return;
    }

    logger.info("successfully got users info", users.length);

    const btcPrices = await fetchBtcPrices();
    if (_.isNull(btcPrices)) {
      logger.error("error getting btc prices");
      return;
    }

    logger.info("successfully received btc prices", btcPrices);

    for (const user of users) {
      if (user.blockChain === Chain.BITCOIN) {
        logger.info("updating assets for the user on btc chain", user.name);

        ctx.reply(BotMessages.WaitForUpdatingWalletMessage);

        const updateUserAssets = await updateBtcWalletAssets(user.telegramId);
        if (!_.isNull(updateUserAssets)) {
          logger.error("error updating user assets", updateUserAssets);
          ctx.reply(BotMessages.ErrorReplyMessage);
          return;
        }

        logger.info("successfully updated user assets and their balance");

        const resp: IAlertResponse = {
          data: new Map(),
        };
        logger.info(
          "getting all the users_assets entries for the given user",
          user
        );

        for (const wallet of user.walletAddresses) {
          const walletAssets: IAssetAlert[] = [];
          logger.info("getting assets for the wallet address", wallet);

          const userAssetsData = await getUserAssetsByWallet(user.id, wallet);
          if (_.isNull(userAssetsData)) {
            logger.error("error getting user assets data");
            ctx.reply(BotMessages.ErrorReplyMessage);
            return;
          }
          if (userAssetsData.length === 0) {
            logger.info("no assets found in the wallet", wallet);
            ctx.reply(`no assets found in wallet: ${wallet}`);
            continue;
          }

          logger.info(
            "received user assets data for the wallet address",
            wallet
          );

          const assetIds: string[] = userAssetsData.map((uadata) => {
            return uadata.assetId;
          });

          logger.info("got all the asset ids for the wallet", wallet);

          logger.info("getting all asset infos for the wallet", wallet);

          const assets = await getAllAssetsByIds(assetIds);
          if (_.isNull(assets)) {
            logger.error("error getting all the assets for wallet", wallet);
            ctx.reply(BotMessages.ErrorReplyMessage);
            return;
          }

          logger.info(
            "received all the assets info for wallet",
            wallet,
            assets
          );

          assets.forEach((asset) => {
            if (asset.type === AssetType.RUNE) {
              const userAsset = userAssetsData.filter(
                (uadata) => uadata.assetId === asset.assetId
              );

              const mePriceSats =
                asset.magicedenMarketPrice * userAsset[0].balance;
              const mePriceBtc = mePriceSats * Math.pow(10, -8);
              const mePriceUSD = mePriceBtc * btcPrices.USD;

              const magicedenUrl = `https://magiceden.io/runes/${
                (asset.metadata as TRuneAssetMetadata).spacedName
              }`;
              // const uniPriceUSD =
              //   asset.unisatMarketPrice * 1e-8 * btcPrices.USD;

              // const unisatUrl = `https://unisat.io/runes/market?tick=${
              //   (asset.metadata as TRuneAssetMetadata).spacedName
              // }`;

              // const totalPriceUSD = totalPrice * 1e-8 * btcPrices.USD;

              const assetInfo: IAssetAlert = {
                name: (asset.metadata as TRuneAssetMetadata).spacedName,
                magicedenUrl: magicedenUrl,
                magicedenPrice: mePriceBtc.toFixed(8),
                magicedenPriceInUSD: parseFloat(
                  mePriceUSD.toFixed(2)
                ).toLocaleString("en-US"),
                balance: userAsset[0].balance.toLocaleString("en-US"),
                symbol: asset.symbol,
                // unisatUrl: unisatUrl,
                // unisatPrice: parseFloat(asset.unisatMarketPrice.toFixed(5)),
                // unisatPriceInUSD: parseFloat(uniPriceUSD.toFixed(5)),
                // totalPriceInSats: parseFloat(totalPrice.toFixed(5)),
                // totalPriceInUSD: parseFloat(totalPriceUSD.toFixed(5)),
              };

              logger.info("pushing asset info", assetInfo);
              walletAssets.push(assetInfo);
            }
          });

          logger.info("adding all the assets info gethered for wallet", wallet);
          resp.data.set(wallet, walletAssets);
        }
        logger.info("alert to be sent is : ", Array.from(resp.data.entries()));

        const textResp = await createMarkupTextFromResp(resp);
        if (_.isNull(textResp)) {
          logger.error("error getting markup text for response");
          return;
        }

        logger.info("textResp is", textResp);

        await sendTelegramMessage(user.telegramId, textResp);
      }
    }

    logger.info("alert sent to user", telegramId);
    return;
  } catch (e) {
    logger.error("error sending user alerts", e);
    ctx.reply(BotMessages.ErrorReplyMessage);
    return;
  }
};
