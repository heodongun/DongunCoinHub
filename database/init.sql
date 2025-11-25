-- DongunCoinHub Database Initialization Script
-- PostgreSQL 15+

-- 확장 기능
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    nickname VARCHAR(50) NOT NULL UNIQUE,
    role VARCHAR(20) NOT NULL DEFAULT 'USER',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Virtual Accounts
CREATE TABLE IF NOT EXISTS virtual_accounts (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    base_cash DECIMAL(20, 2) NOT NULL DEFAULT 10000000.00,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Coins
CREATE TABLE IF NOT EXISTS coins (
    id BIGSERIAL PRIMARY KEY,
    symbol VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    chain VARCHAR(50) NOT NULL,
    contract_address VARCHAR(100),
    decimals INT NOT NULL DEFAULT 8,
    is_enabled BOOLEAN NOT NULL DEFAULT true,
    icon_url VARCHAR(500),
    coingecko_id VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Initial seed data for coins
INSERT INTO coins (symbol, name, chain, decimals, is_enabled, coingecko_id) VALUES
('BTC', 'Bitcoin', 'Bitcoin', 8, true, 'bitcoin'),
('ETH', 'Ethereum', 'Ethereum', 18, true, 'ethereum'),
('SOL', 'Solana', 'Solana', 9, true, 'solana'),
('BNB', 'BNB', 'Binance Smart Chain', 18, true, 'binancecoin'),
('USDT', 'Tether', 'Ethereum', 6, true, 'tether'),
('USDC', 'USD Coin', 'Ethereum', 6, true, 'usd-coin')
ON CONFLICT (symbol) DO NOTHING;

-- Account Balances
CREATE TABLE IF NOT EXISTS account_balances (
    id BIGSERIAL PRIMARY KEY,
    account_id BIGINT NOT NULL REFERENCES virtual_accounts(id) ON DELETE CASCADE,
    coin_id BIGINT NOT NULL REFERENCES coins(id) ON DELETE CASCADE,
    amount DECIMAL(30, 10) NOT NULL DEFAULT 0.0,
    avg_buy_price DECIMAL(20, 2) NOT NULL DEFAULT 0.0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(account_id, coin_id)
);

-- Price Snapshots
CREATE TABLE IF NOT EXISTS price_snapshots (
    id BIGSERIAL PRIMARY KEY,
    coin_id BIGINT NOT NULL REFERENCES coins(id) ON DELETE CASCADE,
    price DECIMAL(20, 8) NOT NULL,
    volume_24h DECIMAL(30, 2) NOT NULL DEFAULT 0.0,
    high_24h DECIMAL(20, 8) NOT NULL DEFAULT 0.0,
    low_24h DECIMAL(20, 8) NOT NULL DEFAULT 0.0,
    change_24h_pct DECIMAL(10, 4) NOT NULL DEFAULT 0.0,
    market_cap DECIMAL(30, 2),
    timestamp TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_price_snapshots_coin_time ON price_snapshots(coin_id, timestamp DESC);

-- Onchain Metrics
CREATE TABLE IF NOT EXISTS onchain_metrics (
    id BIGSERIAL PRIMARY KEY,
    chain_name VARCHAR(50) NOT NULL,
    latest_block_number BIGINT NOT NULL,
    tx_count_24h BIGINT NOT NULL DEFAULT 0,
    active_addresses_24h BIGINT,
    avg_gas_price DECIMAL(20, 8),
    total_value_24h DECIMAL(30, 2),
    timestamp TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    coin_id BIGINT NOT NULL REFERENCES coins(id) ON DELETE CASCADE,
    side VARCHAR(10) NOT NULL,
    type VARCHAR(10) NOT NULL,
    price DECIMAL(20, 8),
    quantity DECIMAL(30, 10) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Trades
CREATE TABLE IF NOT EXISTS trades (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    coin_id BIGINT NOT NULL REFERENCES coins(id) ON DELETE CASCADE,
    fill_price DECIMAL(20, 8) NOT NULL,
    quantity DECIMAL(30, 10) NOT NULL,
    fee_amount DECIMAL(20, 2) NOT NULL DEFAULT 0.0,
    side VARCHAR(10) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- NFT Contracts
CREATE TABLE IF NOT EXISTS nft_contracts (
    id BIGSERIAL PRIMARY KEY,
    chain VARCHAR(50) NOT NULL,
    contract_address VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    owner_wallet VARCHAR(100) NOT NULL,
    vault_wallet VARCHAR(100) NOT NULL,
    is_official BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- NFT Tokens
CREATE TABLE IF NOT EXISTS nft_tokens (
    id BIGSERIAL PRIMARY KEY,
    contract_id BIGINT NOT NULL REFERENCES nft_contracts(id) ON DELETE CASCADE,
    token_id VARCHAR(100) NOT NULL,
    metadata_uri VARCHAR(500) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    image_url VARCHAR(500) NOT NULL,
    attributes TEXT,
    onchain_owner VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'VAULT',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(contract_id, token_id)
);

-- User NFT Inventories
CREATE TABLE IF NOT EXISTS user_nft_inventories (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    nft_token_id BIGINT NOT NULL UNIQUE REFERENCES nft_tokens(id) ON DELETE CASCADE,
    purchase_price DECIMAL(20, 2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'OWNED',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- NFT Withdrawal Requests
CREATE TABLE IF NOT EXISTS nft_withdrawal_requests (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    nft_token_id BIGINT NOT NULL REFERENCES nft_tokens(id) ON DELETE CASCADE,
    target_wallet VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    tx_hash VARCHAR(100),
    gas_fee DECIMAL(20, 8),
    admin_note TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create test user (password: test1234)
INSERT INTO users (email, password_hash, nickname, role) VALUES
('test@donguncoin.com', '$2a$10$xN0H9P5zGp8rJ7qKrX8mZu0YqN6zT8mC9L7sK6wP5fH2xN8yJ9qKu', 'testuser', 'USER')
ON CONFLICT (email) DO NOTHING;

-- Create virtual account for test user
INSERT INTO virtual_accounts (user_id, base_cash)
SELECT id, 10000000.00 FROM users WHERE email = 'test@donguncoin.com'
ON CONFLICT (user_id) DO NOTHING;

COMMIT;
