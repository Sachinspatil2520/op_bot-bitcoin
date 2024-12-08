import { customLogger } from "../logger/logger";
import { getUserByChain } from "../repo/users/getUserByChain";
import {
  API_LIMIT,
  BotMessages,
  CustomError,
  ErrorCodes,
} from "../common/constants";
import { onBoardingButtons } from "../utils/uiComponents";
import { fetchRunesRequest } from "../external/fetchRunes";
import {
  TCatCollectionHoldings,
  TCatCollectionInfoResp,
  TCatCollectionsWalletResp,
  TRunesData,
  TRunesResponse,
} from "../common/types";
import { assets, Prisma } from "../db/generated/client";
import { getAssetsByIds } from "../repo/assets/getAssetsByIds";
import { addAssets } from "../repo/assets/addAssets";
import { deleteUserAssetsByWallet } from "../repo/users_assets/deleteUserAssetsByWallet";
import { addMultipleUserAssets } from "../repo/users_assets/addMultipleUserAssets";
import { AssetType, Chain } from "../common/enums";
import _ from "lodash";
import { CustomErrorResp } from "../common/interfaces";
import { sleep } from "../utils/utils";
import { fetchCat721Collections } from "../external/fetchCat721Collections";
import { fetchCat721CollectionInfo } from "../external/fetchCat721CollectionInfo";
import { getAssetById } from "../repo/assets/getAssetById";

export const updateFractalBtcWalletAssets = async (tgId: string) => {
  const logger = customLogger("updateFractalBtcWalletAssets");
  try {
    logger.info("updating fractal wallet assets", tgId);

    const user = await getUserByChain(tgId, Chain.FRACTAL_BITCOIN);
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

    const fetchedCat721Promises: Map<
      string,
      Promise<TCatCollectionsWalletResp | null>
    > = new Map();

    for (let i = 0; i < user.walletAddresses.length; i++) {
      const curWallet = user.walletAddresses[i];
      logger.info("updating assets in fractal wallet", curWallet);

      const fetchedCat721Promise = fetchCat721Collections(curWallet);
      fetchedCat721Promises.set(curWallet, fetchedCat721Promise);

      if (
        fetchedCat721Promises.size === API_LIMIT ||
        i === user.walletAddresses.length - 1
      ) {
        logger.info("received a batch of promises", fetchedCat721Promises.size);

        for (const [wallet, fetchedCat721Promise] of fetchedCat721Promises) {
          const fetchedWalletHoldings = await fetchedCat721Promise;
          if (_.isNull(fetchedWalletHoldings)) {
            logger.error(
              "error getting cat721 holdings from db for wallet",
              wallet
            );
            const custErr = ErrorCodes.GENERIC_ERROR("internal error");
            return {
              errorCode: custErr.errorCode,
              statusCode: custErr.statusCode,
              body: custErr.message,
            } as CustomErrorResp;
          }

          if (_.isEmpty(fetchedWalletHoldings.data)) {
            logger.info("no holdings found for given wallet", wallet);
            continue;
          }

          logger.info(
            "Cat721 holdings fetched for wallet",
            fetchedWalletHoldings.data.collections.length,
            wallet
          );

          const collectionsList = fetchedWalletHoldings.data.collections;
          const collectionInfoPromises: Promise<TCatCollectionInfoResp | null>[] =
            [];

          for (let j = 0; j < collectionsList.length; j++) {
            const collection = collectionsList[j];
            logger.info("getting collection info", collection.collectionId);

            const collectionInfo = fetchCat721CollectionInfo(
              collection.collectionId
            );
            collectionInfoPromises.push(collectionInfo);

            if (
              collectionInfoPromises.length === API_LIMIT ||
              j === collectionsList.length - 1
            ) {
              const collectionInfos = await Promise.all(collectionInfoPromises);

              logger.info(
                "resolved collection info promises",
                collectionInfoPromises.length
              );

              while (collectionInfoPromises.length > 0) {
                collectionInfoPromises.pop();
              }

              const collectionIds = collectionInfos.map((collection) => {
                return collection ? collection.data.collectionId : "null";
              });

              const cat721Assets = await getAssetsByIds(
                AssetType.INSCRIPTION,
                collectionIds
              );
              if (_.isNull(cat721Assets)) {
                logger.error("error getting cat721 collection from assets");
                const custErr = ErrorCodes.GENERIC_ERROR("internal error");
                return {
                  errorCode: custErr.errorCode,
                  statusCode: custErr.statusCode,
                  body: custErr.message,
                } as CustomErrorResp;
              }

              logger.info("assets present are : ", cat721Assets);
              logger.info(
                `${cat721Assets.length} collections already present in db`
              );

              if (cat721Assets.length !== collectionInfos.length) {
                logger.info("some collections are to be added to assets");

                const assetIds = cat721Assets.map((asset) => {
                  return asset.assetId;
                });

                const collectionsToBeAdded = collectionInfos.filter(
                  (collection) =>
                    collection &&
                    !assetIds.includes(collection.data.collectionId)
                );

                logger.info(
                  "collections to be added are",
                  collectionsToBeAdded.length
                );

                const assetsToBeAdded: Prisma.assetsCreateManyInput[] = [];

                for (const collectionAsset of collectionsToBeAdded) {
                  if (_.isNull(collectionAsset)) {
                    logger.error("no collection info found");
                    const custErr = ErrorCodes.GENERIC_ERROR("internal error");
                    return {
                      errorCode: custErr.errorCode,
                      statusCode: custErr.statusCode,
                      body: custErr.message,
                    } as CustomErrorResp;
                  }

                  logger.info(
                    "Collection is about to be added",
                    collectionAsset.data
                  );

                  const assetToBeAdded: Prisma.assetsCreateManyInput = {
                    assetId: collectionAsset.data.collectionId,
                    name: collectionAsset.data.name,
                    symbol: collectionAsset.data.symbol,
                    type: AssetType.INSCRIPTION,
                    blockchain: Chain.FRACTAL_BITCOIN,
                    metadata: collectionAsset.data.metadata,
                    price: 0,
                    magicedenMarketData: {},
                    magicedenMarketPrice: 0,
                    unisatMarketData: {},
                    unisatMarketPrice: 0,
                    collectionName: collectionAsset.data.name,
                  };
                  assetsToBeAdded.push(assetToBeAdded);
                }

                const addedCollectionsCount = await addAssets(assetsToBeAdded);
                if (_.isNull(addedCollectionsCount)) {
                  logger.error("error adding collections to db");
                  const custErr = ErrorCodes.GENERIC_ERROR("internal error");
                  return {
                    errorCode: custErr.errorCode,
                    statusCode: custErr.statusCode,
                    body: custErr.message,
                  } as CustomErrorResp;
                }

                logger.info(
                  "added all collections to db",
                  addedCollectionsCount.count
                );
              }
            }
          }

          logger.info(
            "deleting all the users_assets entries for wallet if present",
            wallet
          );

          const deletedUserAssets = await deleteUserAssetsByWallet(
            user.id,
            wallet
          );
          if (_.isNull(deletedUserAssets)) {
            logger.info(
              "error deleting all the user_assets data for wallet",
              wallet
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
            wallet
          );

          logger.info("adding new users_assets entries", user.name, wallet);

          const newUserAssetsData: Prisma.users_assetsCreateManyInput[] = [];

          collectionsList.forEach((collection) => {
            const newUserAssetData: Prisma.users_assetsCreateManyInput = {
              userId: user.id,
              assetId: collection.collectionId,
              walletAddress: wallet,
              balance: Number(collection.confirmed),
            };
            logger.info("created new users_assets entry: ", newUserAssetData);
            newUserAssetsData.push(newUserAssetData);
          });

          logger.info("adding new users_assets data", newUserAssetsData);

          const addedUsersAssets = await addMultipleUserAssets(
            newUserAssetsData
          );
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
            wallet
          );
        }
        logger.info("completed adding one batch of assets");

        fetchedCat721Promises.clear();

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
    logger.error("error updating fractal wallets");
    const custErr = ErrorCodes.GENERIC_ERROR("internal error");
    return {
      errorCode: custErr.errorCode,
      statusCode: custErr.statusCode,
      body: custErr.message,
    } as CustomErrorResp;
  }
};
