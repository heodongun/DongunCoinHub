import { useAccount, useReadContract, useReadContracts } from 'wagmi';
import { useState, useEffect } from 'react';
import axios from 'axios';

const ERC721_ABI = [
    {
        inputs: [{ name: 'owner', type: 'address' }],
        name: 'balanceOf',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            { name: 'owner', type: 'address' },
            { name: 'index', type: 'uint256' },
        ],
        name: 'tokenOfOwnerByIndex',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ name: 'tokenId', type: 'uint256' }],
        name: 'tokenURI',
        outputs: [{ name: '', type: 'string' }],
        stateMutability: 'view',
        type: 'function',
    },
] as const;

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS as `0x${string}`;

export interface WalletNFT {
    tokenId: string;
    name: string;
    description: string;
    imageUrl: string;
    metadataUrl: string;
}

export function useWalletNFTs() {
    const { address, isConnected } = useAccount();
    const [nfts, setNfts] = useState<WalletNFT[]>([]);
    const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);

    // 1. Get Balance
    const { data: balance } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: ERC721_ABI,
        functionName: 'balanceOf',
        args: address ? [address] : undefined,
        query: {
            enabled: !!address && !!CONTRACT_ADDRESS,
        },
    });

    // 2. Prepare calls for tokenOfOwnerByIndex
    const balanceNum = balance ? Number(balance) : 0;
    const tokenIndexCalls = Array.from({ length: balanceNum }, (_, i) => ({
        address: CONTRACT_ADDRESS,
        abi: ERC721_ABI,
        functionName: 'tokenOfOwnerByIndex',
        args: [address!, BigInt(i)],
    }));

    const { data: tokenIds } = useReadContracts({
        contracts: tokenIndexCalls as any,
        query: {
            enabled: balanceNum > 0 && !!address,
        },
    });

    // 3. Prepare calls for tokenURI
    const validTokenIds = tokenIds?.map((result) => result.result).filter((id) => id !== undefined) as bigint[] || [];

    const tokenUriCalls = validTokenIds.map((tokenId) => ({
        address: CONTRACT_ADDRESS,
        abi: ERC721_ABI,
        functionName: 'tokenURI',
        args: [tokenId],
    }));

    const { data: tokenUris } = useReadContracts({
        contracts: tokenUriCalls as any,
        query: {
            enabled: validTokenIds.length > 0,
        },
    });

    // 4. Fetch Metadata from URIs
    useEffect(() => {
        const fetchMetadata = async () => {
            if (!tokenUris || tokenUris.length === 0) return;

            setIsLoadingMetadata(true);
            try {
                const nftDataPromises = tokenUris.map(async (uriResult, index) => {
                    const uri = uriResult.result;
                    const tokenId = validTokenIds[index].toString();

                    if (!uri) return null;

                    // Handle IPFS URIs if necessary (simple replacement for now)
                    const httpUri = uri.replace('ipfs://', 'https://ipfs.io/ipfs/');

                    try {
                        interface NFTMetadata {
                            name?: string;
                            description?: string;
                            image?: string;
                        }
                        const response = await axios.get<NFTMetadata>(httpUri);
                        const metadata = response.data;

                        return {
                            tokenId,
                            name: metadata.name || `NFT #${tokenId}`,
                            description: metadata.description || '',
                            imageUrl: metadata.image?.replace('ipfs://', 'https://ipfs.io/ipfs/') || '',
                            metadataUrl: httpUri,
                        };
                    } catch (error) {
                        console.error(`Failed to fetch metadata for token ${tokenId}`, error);
                        return {
                            tokenId,
                            name: `NFT #${tokenId}`,
                            description: 'Metadata load failed',
                            imageUrl: '',
                            metadataUrl: httpUri,
                        };
                    }
                });

                const results = await Promise.all(nftDataPromises);
                setNfts(results.filter((nft) => nft !== null) as WalletNFT[]);
            } catch (error) {
                console.error('Error fetching NFT metadata:', error);
            } finally {
                setIsLoadingMetadata(false);
            }
        };

        if (tokenUris && tokenUris.length > 0) {
            fetchMetadata();
        } else if (balanceNum === 0) {
            setNfts([]);
        }
    }, [tokenUris, validTokenIds, balanceNum]);

    return {
        nfts,
        isLoading: isLoadingMetadata || (balanceNum > 0 && !nfts.length),
        isConnected,
        address,
    };
}
