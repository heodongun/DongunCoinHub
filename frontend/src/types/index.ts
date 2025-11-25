// ============================================================================
// Auth Types
// ============================================================================
export interface User {
  id: number;
  email: string;
  nickname: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  userId: number;
  email: string;
  nickname: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  nickname: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

// ============================================================================
// Account Types
// ============================================================================
export interface AccountSummary {
  nickname: string;
  baseCash: string;
  totalAssetValue: string;
  coinCount: number;
  balances: BalanceWithPrice[];
}

export interface BalanceWithPrice {
  coinSymbol: string;
  coinName: string;
  amount: string;
  avgBuyPrice: string;
  currentPrice: string;
  value: string;
  profitLoss: string;
  profitLossPercent: string;
}

// ============================================================================
// Market Types
// ============================================================================
export interface CoinTicker {
  symbol: string;
  name: string;
  price: string;
  volume24h: string;
  high24h: string;
  low24h: string;
  change24hPct: string;
}

export interface CreateCoinRequest {
  symbol: string;
  name: string;
  chain: string;
  contractAddress?: string;
  iconUrl?: string;
}

// ============================================================================
// Trade Types
// ============================================================================
export interface OrderRequest {
  coinSymbol: string;
  side: 'BUY' | 'SELL';
  type: 'MARKET' | 'LIMIT';
  quantity: string;
  price?: string;
}

export interface OrderResponse {
  orderId: number;
  status: string;
  fillPrice: string;
  quantity: string;
  feeAmount: string;
}

// ============================================================================
// NFT Types
// ============================================================================
export interface NFTToken {
  id: number;
  contractAddress: string;
  tokenId: string;
  name: string;
  description: string;
  imageUrl: string;
  metadataUrl: string;
  price: string;
  status: string;
  currentOwner: string | null;
  createdAt: string;
}

export interface UserNFTInventory {
  id: number;
  userId: number;
  nftTokenId: number;
  purchasePrice: string;
  status: string;
  purchasedAt: string;
  nftToken: NFTToken;
}

export interface BuyNFTRequest {
  nftTokenId: number;
  price: string;
}

export interface WithdrawNFTRequest {
  nftTokenId: number;
  targetWallet: string;
}

export interface NFTWithdrawalRequest {
  id: number;
  userId: number;
  nftTokenId: number;
  targetWallet: string;
  status: string;
  txHash: string | null;
  failureReason: string | null;
  requestedAt: string;
  completedAt: string | null;
}

export interface NFTOrderHistory {
  orderId: number;
  nftTokenId: number;
  tokenName: string;
  imageUrl: string | null;
  rarity: string;
  price: string;
  status: string;
  createdAt: string;
  buyer: string | null;
}

// ============================================================================
// Onchain Types
// ============================================================================
export interface ChainMetric {
  chainName: string;
  latestBlockNumber: number;
  txCount24h: number;
  avgGasPrice: string | null;
}
