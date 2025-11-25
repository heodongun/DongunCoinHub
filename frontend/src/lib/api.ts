import axios from 'axios';
import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  AccountSummary,
  CoinTicker,
  OrderRequest,
  OrderResponse,
  NFTToken,
  UserNFTInventory,
  BuyNFTRequest,
  WithdrawNFTRequest,
  NFTWithdrawalRequest,
  NFTOrderHistory,
  ChainMetric,
} from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        // TODO: Implement refresh token endpoint
        // const { data } = await axios.post(`${API_BASE_URL}/api/auth/refresh`, { refreshToken });
        // localStorage.setItem('accessToken', data.accessToken);
        // originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        // return api(originalRequest);

        throw new Error('Token refresh not implemented');
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// ============================================================================
// Auth API
// ============================================================================
export const authApi = {
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/api/auth/register', data);
    return response.data;
  },

  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/api/auth/login', data);
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },
};

// ============================================================================
// Account API
// ============================================================================
export const accountApi = {
  getSummary: async (): Promise<AccountSummary> => {
    const response = await api.get<AccountSummary>('/api/account/summary');
    return response.data;
  },
};

// ============================================================================
// Market API
// ============================================================================
export const marketApi = {
  getTickers: async (): Promise<CoinTicker[]> => {
    const response = await api.get<CoinTicker[]>('/api/market/tickers');
    return response.data;
  },

  getCoinDetail: async (symbol: string): Promise<CoinTicker> => {
    const response = await api.get<CoinTicker>(`/api/market/coins/${symbol}`);
    return response.data;
  },

  createCoin: async (data: import('@/types').CreateCoinRequest): Promise<CoinTicker> => {
    const response = await api.post<CoinTicker>('/api/market/coins', data);
    return response.data;
  },
};

// ============================================================================
// Trade API
// ============================================================================
export const tradeApi = {
  createOrder: async (data: OrderRequest): Promise<OrderResponse> => {
    const response = await api.post<OrderResponse>('/api/trade/order', data);
    return response.data;
  },
};

// ============================================================================
// NFT API
// ============================================================================
export const nftApi = {
  getAvailableNFTs: async (): Promise<NFTToken[]> => {
    const response = await api.get<NFTToken[]>('/api/nft/list');
    return response.data;
  },

  getMyNFTs: async (): Promise<UserNFTInventory[]> => {
    const response = await api.get<UserNFTInventory[]>('/api/nft/my');
    return response.data;
  },

  buyNFT: async (data: BuyNFTRequest): Promise<UserNFTInventory> => {
    const response = await api.post<UserNFTInventory>('/api/nft/buy', data);
    return response.data;
  },

  withdrawNFT: async (data: WithdrawNFTRequest): Promise<NFTWithdrawalRequest> => {
    const response = await api.post<NFTWithdrawalRequest>('/api/nft/withdraw', data);
    return response.data;
  },

  mintNFT: async (data: {
    contractId: string;
    tokenId: string;
    name: string;
    description: string;
    imageUrl: string;
    metadataUrl: string;
    rarity: string;
    price: string;
  }): Promise<NFTToken> => {
    const response = await api.post<NFTToken>('/api/nft/mint', data);
    return response.data;
  },

  sellNFT: async (data: {
    inventoryId: number;
    price: string;
  }): Promise<{ orderId: number }> => {
    const response = await api.post<{ orderId: number }>('/api/nft/sell', data);
    return response.data;
  },

  getMyOrders: async (): Promise<NFTOrderHistory[]> => {
    const response = await api.get<NFTOrderHistory[]>('/api/nft/orders');
    return response.data;
  },
};

// ============================================================================
// Onchain API
// ============================================================================
export const onchainApi = {
  getChainMetrics: async (chainName: string): Promise<ChainMetric> => {
    const response = await api.get<ChainMetric>(`/api/onchain/chains/${chainName}`);
    return response.data;
  },
};

export default api;
