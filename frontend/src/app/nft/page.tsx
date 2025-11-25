'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { nftApi } from '@/lib/api';
import { formatCurrency, shortenAddress, isValidEthAddress } from '@/lib/utils';
import toast from 'react-hot-toast';
import { useAccount } from 'wagmi';
import type { NFTToken, UserNFTInventory } from '@/types';
import { useWalletNFTs } from '@/hooks/useWalletNFTs';
import Image from 'next/image';

export default function NFTPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { address: walletAddress } = useAccount();
  const { nfts: walletNFTs, isLoading: walletNFTsLoading } = useWalletNFTs();

  const [activeTab, setActiveTab] = useState<'market' | 'my' | 'mint' | 'wallet'>('market');
  const [selectedNFT, setSelectedNFT] = useState<NFTToken | null>(null);
  const [withdrawNFT, setWithdrawNFT] = useState<UserNFTInventory | null>(null);
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [showMintModal, setShowMintModal] = useState(false);
  const [sellNFT, setSellNFT] = useState<UserNFTInventory | null>(null);
  const [sellPrice, setSellPrice] = useState('');
  const [mintForm, setMintForm] = useState({
    contractId: '1',
    tokenId: '',
    name: '',
    description: '',
    imageUrl: '',
    metadataUrl: '',
    rarity: 'COMMON',
    price: ''
  });

  const { data: availableNFTs } = useQuery({
    queryKey: ['availableNFTs'],
    queryFn: nftApi.getAvailableNFTs,
    enabled: isAuthenticated && activeTab === 'market',
  });

  const { data: myNFTs } = useQuery({
    queryKey: ['myNFTs'],
    queryFn: nftApi.getMyNFTs,
    enabled: isAuthenticated && activeTab === 'my',
  });

  const buyMutation = useMutation({
    mutationFn: (data: { nftTokenId: number; price: string }) => nftApi.buyNFT(data),
    onSuccess: () => {
      toast.success('NFT 구매 완료!');
      setSelectedNFT(null);
      queryClient.invalidateQueries({ queryKey: ['availableNFTs'] });
      queryClient.invalidateQueries({ queryKey: ['myNFTs'] });
      queryClient.invalidateQueries({ queryKey: ['accountSummary'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'NFT 구매 실패');
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: (data: { nftTokenId: number; targetWallet: string }) => nftApi.withdrawNFT(data),
    onSuccess: () => {
      toast.success('출금 요청이 접수되었습니다. 처리 중입니다...');
      setWithdrawNFT(null);
      setWithdrawAddress('');
      queryClient.invalidateQueries({ queryKey: ['myNFTs'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || '출금 요청 실패');
    },
  });

  const mintMutation = useMutation({
    mutationFn: (data: typeof mintForm) => nftApi.mintNFT(data),
    onSuccess: () => {
      toast.success('NFT 민팅 완료!');
      setShowMintModal(false);
      setMintForm({
        contractId: '1',
        tokenId: '',
        name: '',
        description: '',
        imageUrl: '',
        metadataUrl: '',
        rarity: 'COMMON',
        price: ''
      });
      queryClient.invalidateQueries({ queryKey: ['availableNFTs'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'NFT 민팅 실패');
    },
  });

  const sellMutation = useMutation({
    mutationFn: (data: { inventoryId: number; price: string }) => nftApi.sellNFT(data),
    onSuccess: () => {
      toast.success('NFT 판매 등록 완료!');
      setSellNFT(null);
      setSellPrice('');
      queryClient.invalidateQueries({ queryKey: ['myNFTs'] });
      queryClient.invalidateQueries({ queryKey: ['availableNFTs'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'NFT 판매 등록 실패');
    },
  });

  const handleBuy = () => {
    if (!selectedNFT) return;

    buyMutation.mutate({
      nftTokenId: selectedNFT.id,
      price: selectedNFT.price,
    });
  };

  const handleWithdraw = () => {
    if (!withdrawNFT) return;

    if (!withdrawAddress) {
      toast.error('지갑 주소를 입력해주세요');
      return;
    }

    if (!isValidEthAddress(withdrawAddress)) {
      toast.error('올바른 Ethereum 주소를 입력해주세요');
      return;
    }

    withdrawMutation.mutate({
      nftTokenId: withdrawNFT.nftTokenId,
      targetWallet: withdrawAddress,
    });
  };

  const handleMint = () => {
    if (!mintForm.tokenId || !mintForm.name || !mintForm.price) {
      toast.error('필수 항목을 입력해주세요');
      return;
    }

    mintMutation.mutate(mintForm);
  };

  const handleSell = () => {
    if (!sellNFT) return;

    if (!sellPrice || parseFloat(sellPrice) <= 0) {
      toast.error('판매 가격을 입력해주세요');
      return;
    }

    sellMutation.mutate({
      inventoryId: sellNFT.id,
      price: sellPrice
    });
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (walletAddress) {
      setWithdrawAddress(walletAddress);
    }
  }, [walletAddress]);

  if (authLoading || !isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">NFT 마켓플레이스</h1>

        {/* Tabs */}
        <div className="flex space-x-2 mb-6">
          <button
            onClick={() => setActiveTab('market')}
            className={`px-6 py-3 rounded-lg font-medium transition ${activeTab === 'market' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'
              }`}
          >
            NFT 마켓
          </button>
          <button
            onClick={() => setActiveTab('my')}
            className={`px-6 py-3 rounded-lg font-medium transition ${activeTab === 'my' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'
              }`}
          >
            내 NFT
          </button>
          <button
            onClick={() => router.push('/nft/orders')}
            className="px-6 py-3 rounded-lg font-medium transition bg-white text-gray-700 hover:bg-gray-50"
          >
            거래 내역
          </button>
          <button
            onClick={() => setActiveTab('wallet')}
            className={`px-6 py-3 rounded-lg font-medium transition ${activeTab === 'wallet' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'
              }`}
          >
            내 지갑 NFT
          </button>
          <button
            onClick={() => setShowMintModal(true)}
            className="ml-auto px-6 py-3 rounded-lg font-medium transition bg-green-600 text-white hover:bg-green-700"
          >
            + NFT 생성
          </button>
        </div>

        {/* Market Tab */}
        {activeTab === 'market' && (
          <div>
            {availableNFTs && availableNFTs.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableNFTs.map((nft) => (
                  <div key={nft.id} className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="aspect-square bg-gray-200 relative">
                      {nft.imageUrl ? (
                        <Image
                          src={nft.imageUrl}
                          alt={nft.name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <span className="text-6xl">🎨</span>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-lg mb-2">{nft.name}</h3>
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{nft.description}</p>
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-sm text-gray-500">가격</span>
                        <span className="text-lg font-bold">{formatCurrency(nft.price)}</span>
                      </div>
                      <button
                        onClick={() => setSelectedNFT(nft)}
                        className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition"
                      >
                        구매하기
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <p className="text-gray-500">판매 중인 NFT가 없습니다</p>
              </div>
            )}
          </div>
        )}

        {/* My NFTs Tab */}
        {activeTab === 'my' && (
          <div>
            {myNFTs && myNFTs.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myNFTs.map((inventory) => {
                  const nft = inventory.nftToken;
                  const canWithdraw = inventory.status === 'OWNED';

                  return (
                    <div key={inventory.id} className="bg-white rounded-lg shadow overflow-hidden">
                      <div className="aspect-square bg-gray-200 relative">
                        {nft.imageUrl ? (
                          <Image
                            src={nft.imageUrl}
                            alt={nft.name}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <span className="text-6xl">🎨</span>
                          </div>
                        )}
                        <div className="absolute top-2 right-2 z-10">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${inventory.status === 'OWNED'
                              ? 'bg-green-100 text-green-800'
                              : inventory.status === 'WITHDRAW_REQUESTED'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                              }`}
                          >
                            {inventory.status}
                          </span>
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-bold text-lg mb-2">{nft.name}</h3>
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{nft.description}</p>
                        <div className="space-y-2 mb-4 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">구매가</span>
                            <span className="font-medium">{formatCurrency(inventory.purchasePrice)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Token ID</span>
                            <span className="font-mono text-xs">{nft.tokenId}</span>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setSellNFT(inventory)}
                            disabled={!canWithdraw}
                            className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {canWithdraw ? '판매하기' : '판매 불가'}
                          </button>
                          <button
                            onClick={() => setWithdrawNFT(inventory)}
                            disabled={!canWithdraw}
                            className="flex-1 bg-purple-600 text-white py-2 rounded-lg font-medium hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {canWithdraw ? '출금하기' : '출금 불가'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <p className="text-gray-500 mb-4">보유한 NFT가 없습니다</p>
                <button
                  onClick={() => setActiveTab('market')}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
                >
                  NFT 구매하러 가기
                </button>
              </div>
            )}
          </div>

        )}

        {/* Wallet Tab */}
        {activeTab === 'wallet' && (
          <div>
            {!walletAddress ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <p className="text-gray-500 mb-4">지갑이 연결되지 않았습니다</p>
                <p className="text-sm text-gray-400">상단 메뉴에서 지갑을 연결해주세요</p>
              </div>
            ) : walletNFTsLoading ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-500">지갑에서 NFT를 불러오는 중...</p>
              </div>
            ) : walletNFTs.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {walletNFTs.map((nft) => (
                  <div key={nft.tokenId} className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="aspect-square bg-gray-200 relative">
                      {nft.imageUrl ? (
                        <Image
                          src={nft.imageUrl}
                          alt={nft.name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <span className="text-6xl">🎨</span>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-lg mb-2">{nft.name}</h3>
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{nft.description}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Token ID</span>
                        <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{nft.tokenId}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <p className="text-gray-500">지갑에 NFT가 없습니다</p>
              </div>
            )}
          </div>
        )}

        {/* Buy Modal */}
        {selectedNFT && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h2 className="text-2xl font-bold mb-4">NFT 구매</h2>
              <div className="mb-6">
                <p className="text-lg font-medium mb-2">{selectedNFT.name}</p>
                <p className="text-sm text-gray-600 mb-4">{selectedNFT.description}</p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">NFT 가격</span>
                    <span className="font-medium">{formatCurrency(selectedNFT.price)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">총 결제 금액</span>
                    <span className="text-lg font-bold">{formatCurrency(selectedNFT.price)}</span>
                  </div>
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setSelectedNFT(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  onClick={handleBuy}
                  disabled={buyMutation.isPending}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {buyMutation.isPending ? '구매 중...' : '구매하기'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mint Modal */}
        {showMintModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-4">NFT 생성 (민팅)</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Token ID *</label>
                  <input
                    type="text"
                    value={mintForm.tokenId}
                    onChange={(e) => setMintForm({ ...mintForm, tokenId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="11"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">NFT 이름 *</label>
                  <input
                    type="text"
                    value={mintForm.name}
                    onChange={(e) => setMintForm({ ...mintForm, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="DongunCoin NFT #11"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">설명</label>
                  <textarea
                    value={mintForm.description}
                    onChange={(e) => setMintForm({ ...mintForm, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    rows={3}
                    placeholder="NFT 설명을 입력하세요"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">이미지 URL</label>
                  <input
                    type="text"
                    value={mintForm.imageUrl}
                    onChange={(e) => setMintForm({ ...mintForm, imageUrl: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="https://example.com/nft.png"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">메타데이터 URL</label>
                  <input
                    type="text"
                    value={mintForm.metadataUrl}
                    onChange={(e) => setMintForm({ ...mintForm, metadataUrl: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="https://example.com/metadata.json"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">희귀도</label>
                  <select
                    value={mintForm.rarity}
                    onChange={(e) => setMintForm({ ...mintForm, rarity: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="COMMON">Common</option>
                    <option value="UNCOMMON">Uncommon</option>
                    <option value="RARE">Rare</option>
                    <option value="EPIC">Epic</option>
                    <option value="LEGENDARY">Legendary</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">판매가 (KRW) *</label>
                  <input
                    type="number"
                    value={mintForm.price}
                    onChange={(e) => setMintForm({ ...mintForm, price: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="100000"
                  />
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowMintModal(false);
                    setMintForm({
                      contractId: '1',
                      tokenId: '',
                      name: '',
                      description: '',
                      imageUrl: '',
                      metadataUrl: '',
                      rarity: 'COMMON',
                      price: ''
                    });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  onClick={handleMint}
                  disabled={mintMutation.isPending}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {mintMutation.isPending ? '생성 중...' : 'NFT 생성'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sell Modal */}
        {sellNFT && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h2 className="text-2xl font-bold mb-4">NFT 판매 등록</h2>
              <div className="mb-6">
                <p className="text-lg font-medium mb-2">{sellNFT.nftToken.name}</p>
                <p className="text-sm text-gray-600 mb-4">
                  NFT를 마켓플레이스에 판매 등록합니다. 다른 사용자가 구매할 수 있습니다.
                </p>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">판매 가격 (KRW)</label>
                  <input
                    type="number"
                    value={sellPrice}
                    onChange={(e) => setSellPrice(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="100000"
                  />
                </div>
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    💡 판매 등록 후 다른 사용자가 구매하면 자동으로 거래가 완료됩니다.
                  </p>
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setSellNFT(null);
                    setSellPrice('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  onClick={handleSell}
                  disabled={sellMutation.isPending}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {sellMutation.isPending ? '등록 중...' : '판매 등록'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Withdraw Modal */}
        {withdrawNFT && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h2 className="text-2xl font-bold mb-4">NFT 출금</h2>
              <div className="mb-6">
                <p className="text-lg font-medium mb-2">{withdrawNFT.nftToken.name}</p>
                <p className="text-sm text-gray-600 mb-4">
                  NFT를 연결된 지갑으로 출금합니다. 출금 후에는 블록체인에 영구적으로 기록됩니다.
                </p>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">출금 지갑 주소</label>
                  <input
                    type="text"
                    value={withdrawAddress}
                    onChange={(e) => setWithdrawAddress(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="0x..."
                  />
                  {walletAddress && (
                    <p className="text-xs text-gray-500 mt-1">
                      현재 연결된 지갑: {shortenAddress(walletAddress)}
                    </p>
                  )}
                </div>
                <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    ⚠️ 출금 요청 후 약 1-3분 소요됩니다. 출금 완료 후 취소할 수 없습니다.
                  </p>
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setWithdrawNFT(null);
                    setWithdrawAddress('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  onClick={handleWithdraw}
                  disabled={withdrawMutation.isPending}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  {withdrawMutation.isPending ? '처리 중...' : '출금하기'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div >
  );
}
