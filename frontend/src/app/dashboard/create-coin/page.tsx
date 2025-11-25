'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { marketApi } from '@/lib/api';
import { CreateCoinRequest } from '@/types';

export default function CreateCoinPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState<CreateCoinRequest>({
        name: '',
        symbol: '',
        chain: 'ethereum',
        contractAddress: '',
        iconUrl: '',
    });
    const [error, setError] = useState('');

    const createCoinMutation = useMutation({
        mutationFn: marketApi.createCoin,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tickers'] });
            router.push('/dashboard');
        },
        onError: (err: any) => {
            setError(err.response?.data?.message || '코인 생성에 실패했습니다.');
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!formData.name || !formData.symbol || !formData.chain) {
            setError('필수 항목을 모두 입력해주세요.');
            return;
        }

        createCoinMutation.mutate(formData);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden">
                <div className="px-6 py-8">
                    <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
                        새 코인 등록
                    </h2>

                    {error && (
                        <div className="bg-red-50 text-red-500 p-4 rounded-md mb-6 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                코인 이름 *
                            </label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                                placeholder="예: Bitcoin"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="symbol" className="block text-sm font-medium text-gray-700">
                                심볼 (Ticker) *
                            </label>
                            <input
                                type="text"
                                id="symbol"
                                name="symbol"
                                value={formData.symbol}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                                placeholder="예: BTC"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="chain" className="block text-sm font-medium text-gray-700">
                                블록체인 네트워크 *
                            </label>
                            <select
                                id="chain"
                                name="chain"
                                value={formData.chain}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                            >
                                <option value="ethereum">Ethereum</option>
                                <option value="bitcoin">Bitcoin</option>
                                <option value="solana">Solana</option>
                                <option value="binance-smart-chain">BNB Chain</option>
                                <option value="polygon-pos">Polygon</option>
                            </select>
                        </div>

                        <div>
                            <label htmlFor="contractAddress" className="block text-sm font-medium text-gray-700">
                                컨트랙트 주소 (선택)
                            </label>
                            <input
                                type="text"
                                id="contractAddress"
                                name="contractAddress"
                                value={formData.contractAddress}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                                placeholder="0x..."
                            />
                        </div>

                        <div>
                            <label htmlFor="iconUrl" className="block text-sm font-medium text-gray-700">
                                아이콘 URL (선택)
                            </label>
                            <input
                                type="url"
                                id="iconUrl"
                                name="iconUrl"
                                value={formData.iconUrl}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                                placeholder="https://example.com/icon.png"
                            />
                        </div>

                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                취소
                            </button>
                            <button
                                type="submit"
                                disabled={createCoinMutation.isPending}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                            >
                                {createCoinMutation.isPending ? '등록 중...' : '등록하기'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
