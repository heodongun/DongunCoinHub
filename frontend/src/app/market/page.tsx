'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { marketApi, tradeApi, accountApi } from '@/lib/api';
import { formatCurrency, formatPercent } from '@/lib/utils';
import toast from 'react-hot-toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { CoinTicker, OrderRequest } from '@/types';

export default function MarketPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [selectedCoin, setSelectedCoin] = useState<CoinTicker | null>(null);
  const [orderSide, setOrderSide] = useState<'BUY' | 'SELL'>('BUY');
  const [quantity, setQuantity] = useState('');
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT'>('MARKET');
  const [limitPrice, setLimitPrice] = useState('');

  // Generate mock chart data based on current price
  const generateChartData = (currentPrice: string) => {
    const price = parseFloat(currentPrice);
    const data = [];
    const now = new Date();

    for (let i = 23; i >= 0; i--) {
      const variance = (Math.random() - 0.5) * 0.05; // ±5% variance
      const time = new Date(now.getTime() - i * 60 * 60 * 1000);
      data.push({
        time: `${time.getHours()}:00`,
        price: price * (1 + variance * (i / 24)),
      });
    }
    return data;
  };

  const { data: tickers } = useQuery({
    queryKey: ['tickers'],
    queryFn: marketApi.getTickers,
    enabled: isAuthenticated,
    refetchInterval: 10000,
  });

  const { data: accountSummary } = useQuery({
    queryKey: ['accountSummary'],
    queryFn: accountApi.getSummary,
    enabled: isAuthenticated,
    refetchInterval: 5000,
  });

  const createOrderMutation = useMutation({
    mutationFn: (data: OrderRequest) => tradeApi.createOrder(data),
    onSuccess: (data) => {
      toast.success(`주문 체결 완료! ${data.quantity} ${selectedCoin?.symbol} @ ${formatCurrency(data.fillPrice)}`);
      setQuantity('');
      setLimitPrice('');
      queryClient.invalidateQueries({ queryKey: ['accountSummary'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || '주문 실패');
    },
  });

  const handleOrder = () => {
    if (!selectedCoin) {
      toast.error('코인을 선택해주세요');
      return;
    }

    if (!quantity || parseFloat(quantity) <= 0) {
      toast.error('수량을 입력해주세요');
      return;
    }

    if (orderType === 'LIMIT' && (!limitPrice || parseFloat(limitPrice) <= 0)) {
      toast.error('가격을 입력해주세요');
      return;
    }

    const orderData: OrderRequest = {
      coinSymbol: selectedCoin.symbol,
      side: orderSide,
      type: orderType,
      quantity: quantity,
      price: orderType === 'LIMIT' ? limitPrice : undefined,
    };

    createOrderMutation.mutate(orderData);
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (tickers && tickers.length > 0 && !selectedCoin) {
      setSelectedCoin(tickers[0]);
    }
  }, [tickers, selectedCoin]);

  if (authLoading || !isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">거래소</h1>

        {/* Account Summary */}
        {accountSummary && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4">내 자산</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">보유 현금</p>
                <p className="text-xl font-bold">{formatCurrency(accountSummary.baseCash)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">총 자산 가치</p>
                <p className="text-xl font-bold">{formatCurrency(accountSummary.totalAssetValue)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">보유 코인</p>
                <p className="text-xl font-bold">{accountSummary.coinCount}개</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Coin List */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">코인 목록</h2>
            </div>
            <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
              {tickers?.map((ticker) => {
                const changeNum = parseFloat(ticker.change24hPct);
                const isPositive = changeNum >= 0;
                const isSelected = selectedCoin?.symbol === ticker.symbol;

                return (
                  <div
                    key={ticker.symbol}
                    onClick={() => setSelectedCoin(ticker)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{ticker.symbol}</div>
                        <div className="text-sm text-gray-500">{ticker.name}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(ticker.price)}</div>
                        <div className={`text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                          {formatPercent(ticker.change24hPct)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Trading Panel */}
          <div className="lg:col-span-2">
            {selectedCoin ? (
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-2xl font-bold">{selectedCoin.symbol}</h2>
                      <p className="text-gray-500">{selectedCoin.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold">{formatCurrency(selectedCoin.price)}</p>
                      <p
                        className={`text-lg ${parseFloat(selectedCoin.change24hPct) >= 0 ? 'text-green-600' : 'text-red-600'}`}
                      >
                        {formatPercent(selectedCoin.change24hPct)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm mb-6">
                    <div>
                      <p className="text-gray-500">24h 고가</p>
                      <p className="font-medium">{formatCurrency(selectedCoin.high24h)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">24h 저가</p>
                      <p className="font-medium">{formatCurrency(selectedCoin.low24h)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">24h 거래량</p>
                      <p className="font-medium">{formatCurrency(selectedCoin.volume24h)}</p>
                    </div>
                  </div>

                  {/* Price Chart */}
                  <div className="mt-4">
                    <h3 className="text-sm font-medium text-gray-600 mb-3">24시간 가격 추이</h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={generateChartData(selectedCoin.price)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis
                          dataKey="time"
                          stroke="#9ca3af"
                          style={{ fontSize: '12px' }}
                        />
                        <YAxis
                          stroke="#9ca3af"
                          style={{ fontSize: '12px' }}
                          tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                        />
                        <Tooltip
                          formatter={(value: number) => formatCurrency(value.toString())}
                          contentStyle={{
                            backgroundColor: '#fff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            padding: '8px'
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="price"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="p-6">
                  {/* Current Holdings */}
                  {accountSummary && selectedCoin && (
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-600 mb-2">보유 현황</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500">보유 수량</p>
                          <p className="text-lg font-bold">
                            {accountSummary.balances.find(b => b.symbol === selectedCoin.symbol)?.quantity || '0'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">평가 금액</p>
                          <p className="text-lg font-bold">
                            {formatCurrency(accountSummary.balances.find(b => b.symbol === selectedCoin.symbol)?.value || '0')}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Order Type Tabs */}
                  <div className="flex space-x-2 mb-6">
                    <button
                      onClick={() => setOrderSide('BUY')}
                      className={`flex-1 py-3 rounded-lg font-medium transition ${
                        orderSide === 'BUY' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      매수
                    </button>
                    <button
                      onClick={() => setOrderSide('SELL')}
                      className={`flex-1 py-3 rounded-lg font-medium transition ${
                        orderSide === 'SELL' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      매도
                    </button>
                  </div>

                  {/* Order Type Selection */}
                  <div className="flex space-x-2 mb-6">
                    <button
                      onClick={() => setOrderType('MARKET')}
                      className={`flex-1 py-2 rounded font-medium text-sm transition ${
                        orderType === 'MARKET' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      시장가
                    </button>
                    <button
                      onClick={() => setOrderType('LIMIT')}
                      className={`flex-1 py-2 rounded font-medium text-sm transition ${
                        orderType === 'LIMIT' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      지정가
                    </button>
                  </div>

                  {/* Order Form */}
                  <div className="space-y-4">
                    {orderType === 'LIMIT' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">가격 (KRW)</label>
                        <input
                          type="number"
                          value={limitPrice}
                          onChange={(e) => setLimitPrice(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="주문 가격"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">수량</label>
                      <input
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="주문 수량"
                        step="0.00000001"
                      />
                    </div>

                    {quantity && (
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">예상 금액</span>
                          <span className="font-medium">
                            {formatCurrency(
                              parseFloat(quantity) *
                                parseFloat(orderType === 'LIMIT' && limitPrice ? limitPrice : selectedCoin.price)
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm mt-2">
                          <span className="text-gray-600">수수료 (0.1%)</span>
                          <span className="font-medium">
                            {formatCurrency(
                              parseFloat(quantity) *
                                parseFloat(orderType === 'LIMIT' && limitPrice ? limitPrice : selectedCoin.price) *
                                0.001
                            )}
                          </span>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={handleOrder}
                      disabled={createOrderMutation.isPending}
                      className={`w-full py-3 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed ${
                        orderSide === 'BUY'
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : 'bg-red-600 hover:bg-red-700 text-white'
                      }`}
                    >
                      {createOrderMutation.isPending ? '주문 중...' : orderSide === 'BUY' ? '매수하기' : '매도하기'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <p className="text-gray-500">코인을 선택해주세요</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
