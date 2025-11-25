-- Insert sample NFTs with correct contract_id
INSERT INTO nft_tokens (contract_id, token_id, name, description, image_url, metadata_uri, metadata_url, onchain_owner, rarity, status) VALUES
(3, '1', 'DongunCoin NFT #1', 'First edition DongunCoin NFT', 'https://picsum.photos/400?random=1', 'https://example.com/metadata/1.json', 'https://example.com/metadata/1.json', '0x0000000000000000000000000000000000000000', 'LEGENDARY', 'VAULT'),
(3, '2', 'DongunCoin NFT #2', 'Rare collectible NFT', 'https://picsum.photos/400?random=2', 'https://example.com/metadata/2.json', 'https://example.com/metadata/2.json', '0x0000000000000000000000000000000000000000', 'RARE', 'VAULT'),
(3, '3', 'DongunCoin NFT #3', 'Epic blockchain art', 'https://picsum.photos/400?random=3', 'https://example.com/metadata/3.json', 'https://example.com/metadata/3.json', '0x0000000000000000000000000000000000000000', 'EPIC', 'VAULT'),
(3, '4', 'DongunCoin NFT #4', 'Uncommon digital asset', 'https://picsum.photos/400?random=4', 'https://example.com/metadata/4.json', 'https://example.com/metadata/4.json', '0x0000000000000000000000000000000000000000', 'UNCOMMON', 'VAULT'),
(3, '5', 'DongunCoin NFT #5', 'Common starter NFT', 'https://picsum.photos/400?random=5', 'https://example.com/metadata/5.json', 'https://example.com/metadata/5.json', '0x0000000000000000000000000000000000000000', 'COMMON', 'VAULT')
ON CONFLICT (contract_id, token_id) DO NOTHING;
