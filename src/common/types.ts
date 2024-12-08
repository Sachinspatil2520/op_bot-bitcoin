export type TRunesResponse = {
  data: TRunesData[];
  block_height: number;
};

export type TRunesData = {
  pk_script: string;
  wallet_addr: string;
  rune_id: string;
  total_balance: string;
  rune_name: string;
  spaced_rune_name: string;
  decimals: number;
  avg_unit_price_in_sats: number;
  symbol: string;
};

export type TUserData = {
  id: number;
  first_name: string;
  last_name: string;
  wallet_address: string;
  runes: TRunesData[];
};

export type TUnisatRunesMarketData = {
  code: number;
  msg: string;
  data: TUnisatRuneData;
};

export type TUnisatRuneData = {
  tick: string;
  curPrice: number;
  changePrice: number;
  changePercent: number;
  btcVolume: number;
  amountVolume: number;
  cap: string;
  capUSD: string;
  holders: number;
  transactions: number;
  symbol: string;
  warning: boolean;
  deployTime: number;
  number: number;
  totalMinted: number;
  runeId: string;
};

export type TMagicEdenRunesMarketData = {
  rune: string;
  runeNumber: number;
  symbol: string;
  ticker: string;
  name: string;
  totalSupply: string;
  formattedTotalSupply: string;
  divisibility: number;
  imageURI: string;
  minOrderSize: number;
  maxOrderSize: number;
  pendingTxnCount: number;
  floorUnitPrice: TFloorUnitPrice;
  marketCap: number;
  holderCount: number;
  volume: TVolumeTimeIntervals;
  deltaFloor: TTimeInterval;
  txnCount: TTimeInterval;
};

export type TFloorUnitPrice = {
  formatted: string;
  value: string;
};

export type TVolumeTimeIntervals = {
  "1d": number;
  "7d": number;
  "30d": number;
  all: number;
};

export type TTimeInterval = {
  "1d": number;
  "7d": number;
  "30d": number;
};

export type TAssetsMetaData = TRuneAssetMetadata | TInscriptionMetadata;

export type TRuneAssetMetadata = {
  spacedName: string;
  ticker: string;
  balance: number;
  divisibility: number;
};

export type TInscriptionMetadata = {
  inscriptionId: string;
  balance: string;
  divisibility: number;
  max_supply: number;
};

export type TAddressValidationResp = {
  isvalid: boolean;
  address: string;
  scriptPubKey: string;
  isscript: boolean;
  iswitness: boolean;
  witness_version: number;
  witness_program: string;
};

export type TCatCollectionsWalletResp = {
  code: number;
  msg: string;
  data: TCatCollectionsWalletData;
};

export type TCatCollectionsWalletData = {
  collections: TCatCollectionHoldings[];
  trackerBlockHeight: number;
};

export type TCatCollectionHoldings = {
  collectionId: string;
  confirmed: string;
};

export type TUnisatWalletResponse = {
  address: string;
  network: string;
  pubkey: string;
  version: string;
};

export type TCatCollectionInfoResp = {
  code: number;
  msg: string;
  data: TCatCollectionInfoData;
};

export type TCatCollectionInfoData = {
  minterAddr: string;
  revealTxid: string;
  revealHeight: number;
  genesisTxid: string;
  name: string;
  symbol: string;
  minterPubKey: string;
  firstMintHeight: number;
  collectionId: string;
  collectionAddr: string;
  collectionPubKey: string;
  metadata: TCatCollectionMetaData;
};

export type TCatCollectionMetaData = {
  max: string;
  icon: string;
  name: string;
  type: string;
  symbol: string;
  premine: string;
  openMint: string;
  receiver: string;
  resource: string;
  minterMd5: string;
  description: string;
  royaltyPercent: string;
};

export type TCat721UtxoResp = {
  code: number;
  msg: string;
  data: TCat721UtxoData;
};

export type TCat721UtxoData = {
  utxos: TCat721Utxos[];
  trackerBlockHeight: number;
};

export type TCat721Utxos = {
  utxo: TCat721UtxoInfo;
  txoStateHashes: string[];
  state: TCat721UtxoStateInfo;
};

export type TCat721UtxoInfo = {
  txId: string;
  outputIndex: number;
  script: string;
  satoshis: string;
};

export type TCat721UtxoStateInfo = {
  address: string;
  localId: string;
};

export type TBtcPricesResp = {
  time: number;
  USD: number;
  EUR: number;
  GBP: number;
  CAD: number;
  CHF: number;
  AUD: number;
  JPY: number;
};
