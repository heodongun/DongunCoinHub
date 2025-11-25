'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { shortenAddress, formatCurrency } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { accountApi } from '@/lib/api';
import { useState, useEffect, useRef } from 'react';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, logout } = useAuth();
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const { data: accountSummary } = useQuery({
    queryKey: ['accountSummary'],
    queryFn: accountApi.getSummary,
    enabled: isAuthenticated,
    refetchInterval: 10000,
  });

  const menuRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 메뉴 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleConnectWallet = () => {
    connect({ connector: injected() });
  };

  const navigation = isAuthenticated
    ? [
        { name: '대시보드', href: '/dashboard' },
        { name: '거래소', href: '/market' },
        { name: 'NFT', href: '/nft' },
      ]
    : [];

  return (
    <nav className="bg-white shadow">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href={isAuthenticated ? "/dashboard" : "/"} className="text-xl font-bold text-blue-600">
              DongunCoin Hub
            </Link>
            {isAuthenticated && (
              <div className="hidden md:flex space-x-4">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      pathname === item.href
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {isAuthenticated && accountSummary ? (
              <>
                {/* 지갑 연결 */}
                {isConnected && address ? (
                  <div className="flex items-center space-x-2">
                    <div className="px-3 py-1 bg-green-100 text-green-700 rounded-md text-sm font-medium">
                      🔗 {shortenAddress(address)}
                    </div>
                    <button
                      onClick={() => disconnect()}
                      className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                    >
                      연결 해제
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleConnectWallet}
                    className="px-4 py-2 bg-purple-600 text-white rounded-md text-sm font-medium hover:bg-purple-700"
                  >
                    지갑 연결
                  </button>
                )}

                {/* 사용자 정보 메뉴 */}
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-3 px-4 py-2 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                  >
                    <div className="text-left">
                      <div className="text-sm font-semibold text-gray-800">
                        {accountSummary.nickname}
                      </div>
                      <div className="text-xs text-gray-600">
                        💰 {formatCurrency(accountSummary.baseCash)}
                      </div>
                    </div>
                    <svg
                      className={`w-4 h-4 text-gray-600 transition-transform ${showUserMenu ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* 드롭다운 메뉴 */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                      <div className="px-4 py-3 border-b border-gray-200">
                        <div className="text-xs text-gray-500 mb-1">내 자산</div>
                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">보유 현금</span>
                            <span className="text-sm font-semibold">{formatCurrency(accountSummary.baseCash)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">총 자산</span>
                            <span className="text-sm font-semibold text-blue-600">{formatCurrency(accountSummary.totalAssetValue)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">보유 코인</span>
                            <span className="text-sm font-semibold">{accountSummary.coinCount}개</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition"
                      >
                        로그아웃
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : isAuthenticated ? (
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-300"
              >
                로그아웃
              </button>
            ) : (
              <div className="flex space-x-2">
                <Link
                  href="/login"
                  className="px-4 py-2 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-100"
                >
                  로그인
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                >
                  회원가입
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
