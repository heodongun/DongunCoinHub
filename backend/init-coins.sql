-- Insert popular coins for trading
INSERT INTO coins (symbol, name, chain, decimals, gecko_id, is_enabled) VALUES
('BTC', 'Bitcoin', 'bitcoin', 8, 'bitcoin', true),
('ETH', 'Ethereum', 'ethereum', 18, 'ethereum', true),
('BNB', 'BNB', 'binance-smart-chain', 18, 'binancecoin', true),
('XRP', 'XRP', 'ripple', 6, 'ripple', true),
('ADA', 'Cardano', 'cardano', 6, 'cardano', true),
('DOGE', 'Dogecoin', 'dogecoin', 8, 'dogecoin', true),
('SOL', 'Solana', 'solana', 9, 'solana', true),
('DOT', 'Polkadot', 'polkadot', 10, 'polkadot', true),
('MATIC', 'Polygon', 'polygon-pos', 18, 'matic-network', true),
('AVAX', 'Avalanche', 'avalanche', 18, 'avalanche-2', true)
ON CONFLICT (symbol) DO NOTHING;

-- Insert NFT contract
INSERT INTO nft_contracts (contract_address, name, symbol, chain, chain_name, owner_wallet, vault_wallet, is_official, is_active) VALUES
('0x15F2fBA7138C6151CaBBa2562134C22E9F5F5da7', 'DongunCoin NFT', 'DGNFT', 'ethereum', 'ethereum-sepolia', '0x8a1b4e42eC06FD42181110A1819b89ea4E2DF29D', '0x8a1b4e42eC06FD42181110A1819b89ea4E2DF29D', true, true)
ON CONFLICT (contract_address) DO NOTHING;
