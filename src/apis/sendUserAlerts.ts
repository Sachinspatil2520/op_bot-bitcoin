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
  TAssetsMetaData,
  TMagicEdenRunesMarketData,
  TRuneAssetMetadata,
  TUnisatRunesMarketData,
} from "../common/types";
import { Prisma } from "../db/generated/client";
import { sendTelegramMessage, createMarkupTextFromResp } from "../utils/utils";
import { fetchBtcPrices } from "../external/fetchBtcPrices";
import { CustomError, ErrorCodes } from "../common/constants";

export const sendUserAlerts = async (interval: AlertInterval) => {
  const logger = customLogger("sendUserAlerts");
  try {
    logger.info("getting users with the given alert interval", interval);

    const users = await getUsersByAlertInterval(interval, Chain.BITCOIN);
    if (_.isNull(users)) {
      logger.error("error getting users");
      const customErr = ErrorCodes.GENERIC_ERROR("error sending user alerts");
      return {
        statusCode: customErr.statusCode,
        errorCode: customErr.errorCode,
        body: customErr.message,
      } as CustomErrorResp;
    }
    if (users.length === 0 || _.isEmpty(users)) {
      logger.info("no users found");
      return null;
    }

    logger.info("received users with the given interval", users);

    const btcPrices = await fetchBtcPrices();
    if (_.isNull(btcPrices)) {
      logger.error("error getting btc prices");
      const customErr = ErrorCodes.GENERIC_ERROR("error sending user alerts");
      return {
        statusCode: customErr.statusCode,
        errorCode: customErr.errorCode,
        body: customErr.message,
      } as CustomErrorResp;
    }

    logger.info("successfully received btc prices", btcPrices);

    for (const user of users) {
      const resp: IAlertResponse = {
        data: new Map(),
      };
      logger.info(
        "getting all the users_assets entries for the given user",
        user
      );

      for (const wallet of user.walletAddresses) {
        const walletAssets: IAssetAlert[] = [];
        logger.info("getting users_assets for the wallet address", wallet);

        const userAssetsData = await getUserAssetsByWallet(user.id, wallet);
        if (_.isNull(userAssetsData)) {
          logger.info("error getting users assests by wallet ");
          const customErr = ErrorCodes.GENERIC_ERROR("internal error");
          return {
            statusCode: customErr.statusCode,
            errorCode: customErr.errorCode,
            body: customErr.message,
          } as CustomErrorResp;
        }
        if (userAssetsData.length === 0) {
          logger.info("no assets found in the wallet", wallet);
          sendTelegramMessage(
            user.telegramId,
            `no assets found in wallet: ${wallet}`
          );
          continue;
        }

        logger.info("received user assets data for the wallet address", wallet);

        const assetIds: string[] = userAssetsData.map((uadata) => {
          return uadata.assetId;
        });

        logger.info("got all the asset ids for the wallet", wallet);

        logger.info("getting all asset infos for the wallet", wallet);

        const assets = await getAllAssetsByIds(assetIds);
        if (_.isNull(assets)) {
          logger.error("error getting all the assets for wallet", wallet);
          const custErr = ErrorCodes.GENERIC_ERROR("internal error");
          return {
            statusCode: custErr.statusCode,
            errorCode: custErr.errorCode,
            body: custErr.message,
          } as CustomErrorResp;
        }

        logger.info("received all the assets info for wallet", wallet, assets);

        assets.forEach((asset) => {
          if (asset.type === AssetType.RUNE) {
            const userAsset = userAssetsData.filter(
              (uadata) => uadata.assetId === asset.assetId
            );

            const mePriceBtc =
              asset.magicedenMarketPrice * userAsset[0].balance * 1e-8;
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
      logger.info("textResp is", textResp);

      await sendTelegramMessage(user.telegramId, textResp || "");

      logger.info("alert sent to user", user.telegramId);
    }
    logger.info("alerts sent to all the users");

    return null;
  } catch (e) {
    logger.error("error sending user alerts", e);
    const custErr = ErrorCodes.GENERIC_ERROR();
    return {
      statusCode: custErr.statusCode,
      errorCode: custErr.errorCode,
      body: custErr.message,
    } as CustomErrorResp;
  }
};
