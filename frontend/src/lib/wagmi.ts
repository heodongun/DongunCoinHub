import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia } from 'wagmi/chains';
import { createStorage, cookieStorage } from 'wagmi';

if (typeof window === 'undefined') {
  const noopStorage = {
    getItem: (_key: string) => null,
    setItem: (_key: string, _value: any) => { },
    removeItem: (_key: string) => { },
    clear: () => { },
    length: 0,
    key: (_index: number) => null,
  };
  (global as any).localStorage = noopStorage;
}

export const config = getDefaultConfig({
  appName: 'DongunCoin Hub',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
  chains: [sepolia],
  ssr: true,
  storage: createStorage({
    storage: cookieStorage,
  }),
});
