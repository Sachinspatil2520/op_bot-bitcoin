import { customLogger } from "../logger/logger";
import { getUserByTgId } from "../repo/users/getUserByTgId";
import {
  API_LIMIT,
  BotMessages,
  CustomError,
  ErrorCodes,
} from "../common/constants";
import { onBoardingButtons } from "../utils/uiComponents";
import { fetchRunesRequest } from "../external/fetchRunes";
import { TRunesData, TRunesResponse } from "../common/types";
import { assets, Prisma } from "../db/generated/client";
import { getAssetsByIds } from "../repo/assets/getAssetsByIds";
import { addAssets } from "../repo/assets/addAssets";
import { deleteUserAssetsByWallet } from "../repo/users_assets/deleteUserAssetsByWallet";
import { addMultipleUserAssets } from "../repo/users_assets/addMultipleUserAssets";
import { AssetType, Chain } from "../common/enums";
import _ from "lodash";
import { CustomErrorResp } from "../common/interfaces";
import { sleep } from "../utils/utils";
import { getUserByChain } from "../repo/users/getUserByChain";

export const updateBtcWalletAssets = async (tgId: string) => {
  const logger = customLogger("updateBtcWalletAssets");
  try {
    logger.info("updating btc wallet assets", tgId);

    const user = await getUserByChain(tgId, Chain.BITCOIN);
    if (_.isNull(user)) {
      logger.info("no user found");
      const custErr = ErrorCodes.GENERIC_ERROR("internal error");
      return {
        errorCode: custErr.errorCode,
        statusCode: custErr.statusCode,
        body: custErr.message,
      } as CustomErrorResp;
    }

    logger.info("user info found", user);

    const fetchedRunesPromises: Promise<TRunesResponse | null>[] = [];

    for (let i = 0; i < user.walletAddresses.length; i++) {
      const curWallet = user.walletAddresses[i];
      logger.info("updating assets in btc wallet", curWallet);

      const fetchedRunesPromise = fetchRunesRequest(curWallet);
      fetchedRunesPromises.push(fetchedRunesPromise);

      if (
        fetchedRunesPromises.length === API_LIMIT ||
        i === user.walletAddresses.length - 1
      ) {
        const fetchedRunes = await Promise.all(fetchedRunesPromises);
        logger.info("resolved all the promises", fetchedRunes.length);

        while (fetchedRunesPromises.length > 0) {
          fetchedRunesPromises.pop();
        }

        for (const walletRunes of fetchedRunes) {
          if (_.isNull(walletRunes)) {
            logger.error("error getting runes for wallet");
            const custErr = ErrorCodes.GENERIC_ERROR("internal error");
            return {
              errorCode: custErr.errorCode,
              statusCode: custErr.statusCode,
              body: custErr.message,
            } as CustomErrorResp;
          }

          if (_.isEmpty(walletRunes.data)) {
            logger.info("no runes data found for given wallet");
            continue;
          }

          const walletAddress = walletRunes.data[0].wallet_addr;

          logger.info(
            "Runes data fetched for wallet",
            walletRunes.data.length,
            walletAddress
          );

          const fetchedRuneIds: string[] = [];
          walletRunes.data.forEach((rune: TRunesData) => {
            fetchedRuneIds.push(rune.rune_id);
          });

          logger.info("getting assets for given ids", fetchedRuneIds);

          const runeAssets = await getAssetsByIds(
            AssetType.RUNE,
            fetchedRuneIds
          );
          if (_.isNull(runeAssets)) {
            logger.error("error getting runes from assets");
            const custErr = ErrorCodes.GENERIC_ERROR("internal error");
            return {
              errorCode: custErr.errorCode,
              statusCode: custErr.statusCode,
              body: custErr.message,
            } as CustomErrorResp;
          }

          logger.info(
            `found ${runeAssets.length} assets already present in db`
          );

          const newlyAddedAssets: assets[] = [];

          if (_.size(runeAssets) !== _.size(walletRunes.data)) {
            const assetDataIds: string[] = [];

            runeAssets.forEach((rune) => {
              assetDataIds.push(rune.assetId);
            });

            logger.info(
              "got all asset_ids of runes already present",
              assetDataIds
            );

            const runeIdToBeAdded = fetchedRuneIds.filter(
              (runeId) => !assetDataIds.includes(runeId)
            );

            logger.info(
              "assets are not present for given runes",
              runeIdToBeAdded
            );
            logger.info("fecthed rune ids are:", fetchedRuneIds);

            const runeDataToBeAdded = walletRunes.data.filter((rune) =>
              runeIdToBeAdded.includes(rune.rune_id)
            );

            logger.info(
              `runes data to be added is of length ${runeDataToBeAdded.length}`,
              runeDataToBeAdded
            );

            logger.info("adding runes to assets");

            const assetsToBeAdded: Prisma.assetsCreateManyInput[] = [];
            runeDataToBeAdded.forEach((runeData) => {
              const assetToBeAdded: Prisma.assetsCreateManyInput = {
                assetId: runeData.rune_id,
                name: runeData.rune_name,
                symbol: runeData.symbol,
                type: AssetType.RUNE,
                blockchain: Chain.BITCOIN,
                metadata: {
                  spacedName: runeData.spaced_rune_name,
                  ticker: runeData.rune_name,
                  decimals: runeData.decimals,
                },
                price: runeData.avg_unit_price_in_sats,
                magicedenMarketData: {},
                magicedenMarketPrice: 0,
                unisatMarketData: {},
                unisatMarketPrice: 0,
                collectionName: "",
              };
              assetsToBeAdded.push(assetToBeAdded);
            });

            const addedRunesCount = await addAssets(assetsToBeAdded);
            if (_.isNull(addedRunesCount)) {
              logger.error("error adding runes to db");
              const custErr = ErrorCodes.GENERIC_ERROR("internal error");
              return {
                errorCode: custErr.errorCode,
                statusCode: custErr.statusCode,
                body: custErr.message,
              } as CustomErrorResp;
            }

            logger.info("added all runes to assets", addedRunesCount);

            logger.info("getting all the added assets");

            const addedRunes = await getAssetsByIds(
              AssetType.RUNE,
              runeIdToBeAdded
            );
            if (_.isNull(addedRunes)) {
              logger.error(
                "error getting runes in assets table",
                runeIdToBeAdded
              );
              const custErr = ErrorCodes.GENERIC_ERROR("internal error");
              return {
                errorCode: custErr.errorCode,
                statusCode: custErr.statusCode,
                body: custErr.message,
              } as CustomErrorResp;
            }

            addedRunes.forEach((rune) => {
              newlyAddedAssets.push(rune);
            });
            logger.info("received all the runes added now", newlyAddedAssets);
          }
          logger.info(
            "deleting all the users_assets entries for wallet if present",
            walletAddress
          );

          const deletedUserAssets = await deleteUserAssetsByWallet(
            user.id,
            walletAddress
          );
          if (_.isNull(deletedUserAssets)) {
            logger.info(
              "error deleting all the user_assets data for wallet",
              walletAddress
            );
            const custErr = ErrorCodes.GENERIC_ERROR("internal error");
            return {
              errorCode: custErr.errorCode,
              statusCode: custErr.statusCode,
              body: custErr.message,
            } as CustomErrorResp;
          }

          logger.info(
            "successfully deleted all the users_assets data for wallet",
            deletedUserAssets.count,
            walletAddress
          );

          logger.info(
            "adding new users_assets entries",
            user.name,
            walletAddress
          );

          const newUserAssetsData: Prisma.users_assetsCreateManyInput[] = [];

          walletRunes.data.forEach((runeAsset) => {
            const totalBalance =
              Number(runeAsset.total_balance) *
              Math.pow(10, -runeAsset.decimals);
            const newUserAssetData: Prisma.users_assetsCreateManyInput = {
              userId: user.id,
              assetId: runeAsset.rune_id,
              walletAddress: walletAddress,
              balance: totalBalance,
            };
            logger.info("created new users_assets entry: ", newUserAssetData);
            newUserAssetsData.push(newUserAssetData);
          });

          logger.info("adding new users_assets data", newUserAssetsData);

          const addedUsersAssets =
            await addMultipleUserAssets(newUserAssetsData);
          if (_.isNull(addedUsersAssets)) {
            logger.error("error adding user_assets data");
            const custErr = ErrorCodes.GENERIC_ERROR("internal error");
            return {
              errorCode: custErr.errorCode,
              statusCode: custErr.statusCode,
              body: custErr.message,
            } as CustomErrorResp;
          }

          logger.info(
            "successfully added users_assets data for wallet",
            user.name,
            walletAddress
          );
        }

        logger.info("successfully updated a batch of runes");

        logger.info("waiting for 5 seconds");
        await sleep(5000);
        logger.info("wait is done");
      }
    }
    logger.info(
      "updated all the assets and their balances for user",
      user.name
    );
    return null;
  } catch (e) {
    logger.error("error updating wallet assets", e);
    const custErr = ErrorCodes.GENERIC_ERROR("internal error");
    return {
      errorCode: custErr.errorCode,
      statusCode: custErr.statusCode,
      body: custErr.message,
    } as CustomErrorResp;
  }
};
