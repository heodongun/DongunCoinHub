'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { accountApi, marketApi } from '@/lib/api';
import { formatCurrency, formatNumber, formatPercent } from '@/lib/utils';

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const { data: accountSummary, isLoading: accountLoading } = useQuery({
    queryKey: ['accountSummary'],
    queryFn: accountApi.getSummary,
    enabled: isAuthenticated,
  });

  const { data: tickers, isLoading: tickersLoading } = useQuery({
    queryKey: ['tickers'],
    queryFn: marketApi.getTickers,
    enabled: isAuthenticated,
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  if (authLoading || !isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">대시보드</h1>

        {/* Account Summary */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm text-gray-600 mb-2">보유 현금</p>
            <p className="text-2xl font-bold">
              {accountLoading ? '...' : formatCurrency(accountSummary?.baseCash || '0')}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm text-gray-600 mb-2">총 자산</p>
            <p className="text-2xl font-bold">
              {accountLoading ? '...' : formatCurrency(accountSummary?.totalAssetValue || '0')}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm text-gray-600 mb-2">보유 코인</p>
            <p className="text-2xl font-bold">
              {accountLoading ? '...' : accountSummary?.coinCount || 0}종
            </p>
          </div>
        </div>

        {/* My Holdings */}
        {accountSummary && accountSummary.balances.length > 0 && (
          <div className="bg-white rounded-lg shadow mb-8">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">내 보유 코인</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">코인</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">보유량</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">평균 매수가</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">현재가</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">평가금액</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">손익률</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {accountSummary.balances.map((balance) => {
                    const profitLossNum = parseFloat(balance.profitLossPercent);
                    const isProfit = profitLossNum >= 0;

                    return (
                      <tr key={balance.coinSymbol} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-medium">{balance.coinSymbol}</div>
                            <div className="text-sm text-gray-500">{balance.coinName}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">{formatNumber(balance.amount, 8)}</td>
                        <td className="px-6 py-4 text-right">{formatCurrency(balance.avgBuyPrice)}</td>
                        <td className="px-6 py-4 text-right">{formatCurrency(balance.currentPrice)}</td>
                        <td className="px-6 py-4 text-right font-medium">{formatCurrency(balance.value)}</td>
                        <td className={`px-6 py-4 text-right font-medium ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                          {formatPercent(balance.profitLossPercent)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Market Overview */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold">시장 현황</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">코인</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">현재가</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">24h 변동</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">24h 고가</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">24h 저가</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">24h 거래량</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {tickersLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      로딩 중...
                    </td>
                  </tr>
                ) : (
                  tickers?.map((ticker) => {
                    const changeNum = parseFloat(ticker.change24hPct);
                    const isPositive = changeNum >= 0;

                    return (
                      <tr key={ticker.symbol} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-medium">{ticker.symbol}</div>
                            <div className="text-sm text-gray-500">{ticker.name}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right font-medium">{formatCurrency(ticker.price)}</td>
                        <td className={`px-6 py-4 text-right font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                          {formatPercent(ticker.change24hPct)}
                        </td>
                        <td className="px-6 py-4 text-right">{formatCurrency(ticker.high24h)}</td>
                        <td className="px-6 py-4 text-right">{formatCurrency(ticker.low24h)}</td>
                        <td className="px-6 py-4 text-right">{formatCurrency(ticker.volume24h)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
