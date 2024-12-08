import { assets } from "../db/generated/client";
import { AlertInterval, AssetType, Chain, MarketPlaceName } from "./enums";
import { TMagicEdenRunesMarketData, TUnisatRunesMarketData } from "./types";

export interface IRune {
  runeIdBlock: number;
  runeIdTx: number;
  runeAmount: number;
  runeName: string;
  runeSymbol: string;
}

export interface IInscription {
  inscriptionId: number;
  name: string;
}

export interface IBrc20 {
  ticker: string;
}

export interface ICreateAssetsPayload {
  type: AssetType;
  blockchain: Chain;
  ids: IAssetIDs[];
  collectionName?: string;
}

export interface IAssetIDs {
  assetId: string;
  spacedName?: string;
}

export interface IAssetInfoResp {
  magiceden?: TMagicEdenRunesMarketData | null;
  unisat?: TUnisatRunesMarketData | null;
}

export interface CustomErrorResp {
  errorCode: string;
  statusCode: number;
  body: string;
}

export interface IUserConfig {
  alert_interval?: AlertInterval;
}

export interface IAssetAlert {
  name: string;
  symbol: string;
  magicedenUrl: string;
  magicedenPrice: string;
  magicedenPriceInUSD: string;
  // unisatUrl: string;
  // unisatPrice: number;
  // unisatPriceInUSD: number;
  balance: string;
  // totalPriceInSats: number;
  // totalPriceInUSD: number;
}

export interface IAlertResponse {
  data: Map<string, IAssetAlert[]>;
}

export interface IBtcWalletSummary {
  totalAssets: number;
  totalValueInBtc: number;
  totalValueInUsd: string;
  runesPercentage: number;
}

export interface IBtcOverallWalletSummary {
  totalAssets: number;
  totalValueInBtc: number;
  totalValueInUsd: string;
  runesPercentage: number;
  totalWallets: number;
}

export interface IUserAssets {
  data: Map<string, assets[]>;
}

// "code": 0,
//     "msg": "OK",
//     "data": {
//         "collections": [
//             {
//                 "collectionId": "854c67f7710396f99ab5d8b49295028ae6a5efe901c501a88d97f6d2080de765_0",
//                 "confirmed": "64"
//             },
//             {
//                 "collectionId": "342cd58f1900a0b42113936ec0204dae53115f3b2e223c9b5b2ee8b50c4412fc_0",
//                 "confirmed": "1"
//             },
//             {
//                 "collectionId": "2b2e75498c42ffbee8dd82d5c7adacb8a52ac43b4edd2944ec4445d2522b861e_0",
//                 "confirmed": "30"
//             },
//             {
//                 "collectionId": "b51202c5277e68672f4b7d51b9193cdfe68e4cc13307bee626ce944f58aa32f2_0",
//                 "confirmed": "1"
//             }
//         ],
//         "trackerBlockHeight": 189589
//     }
export interface ICat721CollectionsResp {}
