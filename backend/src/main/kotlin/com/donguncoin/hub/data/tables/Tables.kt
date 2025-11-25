package com.donguncoin.hub.data.tables

import org.jetbrains.exposed.dao.id.LongIdTable
import org.jetbrains.exposed.sql.javatime.CurrentTimestamp
import org.jetbrains.exposed.sql.javatime.timestamp

// Users Table
object Users : LongIdTable("users") {
    val email = varchar("email", 255).uniqueIndex()
    val passwordHash = varchar("password_hash", 255)
    val nickname = varchar("nickname", 50).uniqueIndex()
    val role = varchar("role", 20).default("USER")
    val isActive = bool("is_active").default(true)
    val createdAt = timestamp("created_at").defaultExpression(CurrentTimestamp())
    val updatedAt = timestamp("updated_at").defaultExpression(CurrentTimestamp())
}

// Virtual Accounts Table
object VirtualAccounts : LongIdTable("virtual_accounts") {
    val userId = reference("user_id", Users).uniqueIndex()
    val baseCash = decimal("base_cash", 20, 2).default(java.math.BigDecimal("10000000.00"))
    val totalProfit = decimal("total_profit", 20, 2).default(java.math.BigDecimal.ZERO)
    val createdAt = timestamp("created_at").defaultExpression(CurrentTimestamp())
    val updatedAt = timestamp("updated_at").defaultExpression(CurrentTimestamp())
}

// Coins Table
object Coins : LongIdTable("coins") {
    val symbol = varchar("symbol", 20).uniqueIndex()
    val name = varchar("name", 100)
    val geckoId = varchar("gecko_id", 100).nullable()
    val isEnabled = bool("is_enabled").default(true)
    val createdAt = timestamp("created_at").defaultExpression(CurrentTimestamp())
}

// Account Balances Table
object AccountBalances : LongIdTable("account_balances") {
    val accountId = reference("account_id", VirtualAccounts)
    val coinId = reference("coin_id", Coins)
    val amount = decimal("amount", 30, 10).default(java.math.BigDecimal.ZERO)
    val avgBuyPrice = decimal("avg_buy_price", 20, 2).default(java.math.BigDecimal.ZERO)
    val createdAt = timestamp("created_at").defaultExpression(CurrentTimestamp())
    val updatedAt = timestamp("updated_at").defaultExpression(CurrentTimestamp())

    init {
        uniqueIndex(accountId, coinId)
    }
}

// Price Snapshots Table
object PriceSnapshots : LongIdTable("price_snapshots") {
    val coinId = reference("coin_id", Coins)
    val price = decimal("price", 20, 2)
    val volume24h = decimal("volume_24h", 30, 2).nullable()
    val high24h = decimal("high_24h", 20, 2).nullable()
    val low24h = decimal("low_24h", 20, 2).nullable()
    val change24hPct = decimal("change_24h_pct", 10, 4).nullable()
    val marketCap = decimal("market_cap", 30, 2).nullable()
    val timestamp = timestamp("timestamp").defaultExpression(CurrentTimestamp())
}

// Onchain Metrics Table
object OnchainMetrics : LongIdTable("onchain_metrics") {
    val chainName = varchar("chain_name", 50)
    val latestBlockNumber = long("latest_block_number")
    val txCount24h = long("tx_count_24h").default(0L)
    val avgGasPrice = decimal("avg_gas_price", 30, 10)
    val timestamp = timestamp("timestamp").defaultExpression(CurrentTimestamp())
}

// Orders Table
object Orders : LongIdTable("orders") {
    val userId = reference("user_id", Users)
    val accountId = reference("account_id", VirtualAccounts)
    val coinId = reference("coin_id", Coins)
    val side = varchar("side", 10) // BUY, SELL
    val orderType = varchar("order_type", 10).default("MARKET")
    val quantity = decimal("quantity", 30, 10)
    val limitPrice = decimal("limit_price", 20, 2).nullable()
    val executedPrice = decimal("executed_price", 20, 2).nullable()
    val status = varchar("status", 20).default("PENDING")
    val executedAt = timestamp("executed_at").nullable()
    val createdAt = timestamp("created_at").defaultExpression(CurrentTimestamp())
}

// Trades Table
object Trades : LongIdTable("trades") {
    val orderId = reference("order_id", Orders)
    val userId = reference("user_id", Users)
    val coinId = reference("coin_id", Coins)
    val side = varchar("side", 10)
    val quantity = decimal("quantity", 30, 10)
    val price = decimal("price", 20, 2)
    val fee = decimal("fee", 20, 2)
    val total = decimal("total", 20, 2)
    val createdAt = timestamp("created_at").defaultExpression(CurrentTimestamp())
}

// NFT Contracts Table
object NFTContracts : LongIdTable("nft_contracts") {
    val contractAddress = varchar("contract_address", 42).uniqueIndex()
    val name = varchar("name", 255)
    val symbol = varchar("symbol", 20)
    val chainName = varchar("chain_name", 50).default("ethereum-sepolia")
    val isOfficial = bool("is_official").default(true)
    val isActive = bool("is_active").default(true)
    val createdAt = timestamp("created_at").defaultExpression(CurrentTimestamp())
}

// NFT Tokens Table
object NFTTokens : LongIdTable("nft_tokens") {
    val contractId = reference("contract_id", NFTContracts)
    val tokenId = varchar("token_id", 100)
    val name = varchar("name", 255)
    val description = text("description").nullable()
    val imageUrl = varchar("image_url", 512).nullable()
    val metadataUrl = varchar("metadata_url", 512).nullable()
    val rarity = varchar("rarity", 50).default("COMMON")
    val status = varchar("status", 50).default("VAULT")
    val currentOwner = varchar("current_owner", 42).nullable()
    val mintedAt = timestamp("minted_at").defaultExpression(CurrentTimestamp())
    val createdAt = timestamp("created_at").defaultExpression(CurrentTimestamp())

    init {
        uniqueIndex(contractId, tokenId)
    }
}

// User NFT Inventories Table
object UserNFTInventories : LongIdTable("user_nft_inventories") {
    val userId = reference("user_id", Users)
    val nftTokenId = reference("nft_token_id", NFTTokens)
    val purchasePrice = decimal("purchase_price", 20, 2)
    val status = varchar("status", 50).default("OWNED")
    val acquiredAt = timestamp("acquired_at").defaultExpression(CurrentTimestamp())

    init {
        uniqueIndex(userId, nftTokenId)
    }
}

// NFT Withdrawal Requests Table
object NFTWithdrawalRequests : LongIdTable("nft_withdrawal_requests") {
    val userId = reference("user_id", Users)
    val nftTokenId = reference("nft_token_id", NFTTokens)
    val targetWallet = varchar("target_wallet", 42)
    val status = varchar("status", 50).default("PENDING")
    val txHash = varchar("tx_hash", 66).nullable()
    val failureReason = text("failure_reason").nullable()
    val requestedAt = timestamp("requested_at").defaultExpression(CurrentTimestamp())
    val completedAt = timestamp("completed_at").nullable()
}

// NFT Orders Table
object NFTOrders : LongIdTable("nft_orders") {
    val userId = reference("user_id", Users)
    val nftTokenId = reference("nft_token_id", NFTTokens)
    val price = decimal("price", 20, 2)
    val status = varchar("status", 20).default("PENDING")
    val createdAt = timestamp("created_at").defaultExpression(CurrentTimestamp())
    val completedAt = timestamp("completed_at").nullable()
}

// NFT Trades Table
object NFTTrades : LongIdTable("nft_trades") {
    val orderId = reference("order_id", NFTOrders)
    val buyerId = reference("buyer_id", Users)
    val nftTokenId = reference("nft_token_id", NFTTokens)
    val price = decimal("price", 20, 2)
    val fee = decimal("fee", 20, 2)
    val createdAt = timestamp("created_at").defaultExpression(CurrentTimestamp())
}

// Watchlists Table
object Watchlists : LongIdTable("watchlists") {
    val userId = reference("user_id", Users)
    val coinId = reference("coin_id", Coins)
    val createdAt = timestamp("created_at").defaultExpression(CurrentTimestamp())

    init {
        uniqueIndex(userId, coinId)
    }
}
