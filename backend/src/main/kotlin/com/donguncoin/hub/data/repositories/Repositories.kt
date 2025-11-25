package com.donguncoin.hub.data.repositories

import com.donguncoin.hub.data.tables.*
import com.donguncoin.hub.domain.models.*
import org.jetbrains.exposed.dao.id.EntityID
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.transactions.transaction
import java.math.BigDecimal
import java.time.Instant

// ============================================================================
// User Repository
// ============================================================================
class UserRepository {
    fun createUser(email: String, passwordHash: String, nickname: String): User? = transaction {
        val userId = Users.insertAndGetId {
            it[Users.email] = email
            it[Users.passwordHash] = passwordHash
            it[Users.nickname] = nickname
        }

        VirtualAccounts.insert {
            it[VirtualAccounts.userId] = userId
            it[baseCash] = BigDecimal("10000000.00")
        }

        findById(userId.value)
    }

    fun findById(id: Long): User? = transaction {
        Users.select { Users.id eq id }
            .map { toUser(it) }
            .singleOrNull()
    }

    fun findByEmail(email: String): User? = transaction {
        Users.select { Users.email eq email }
            .map { toUser(it) }
            .singleOrNull()
    }

    fun findByNickname(nickname: String): User? = transaction {
        Users.select { Users.nickname eq nickname }
            .map { toUser(it) }
            .singleOrNull()
    }

    private fun toUser(row: ResultRow) = User(
        id = row[Users.id].value,
        email = row[Users.email],
        passwordHash = row[Users.passwordHash],
        nickname = row[Users.nickname],
        role = row[Users.role],
        isActive = row[Users.isActive],
        createdAt = row[Users.createdAt],
        updatedAt = row[Users.updatedAt]
    )
}

// ============================================================================
// Account Repository
// ============================================================================
class AccountRepository {
    fun getAccountByUserId(userId: Long): VirtualAccount? = transaction {
        VirtualAccounts.select { VirtualAccounts.userId eq userId }
            .map { toVirtualAccount(it) }
            .singleOrNull()
    }

    fun getBalances(accountId: Long): List<CoinBalance> = transaction {
        (AccountBalances innerJoin Coins)
            .select { AccountBalances.accountId eq accountId }
            .map { toCoinBalance(it) }
    }

    fun getBalance(accountId: Long, coinId: Long): CoinBalance? = transaction {
        (AccountBalances innerJoin Coins)
            .select {
                (AccountBalances.accountId eq accountId) and
                (AccountBalances.coinId eq coinId)
            }
            .map { toCoinBalance(it) }
            .singleOrNull()
    }

    fun updateBaseCash(accountId: Long, newAmount: BigDecimal) = transaction {
        VirtualAccounts.update({ VirtualAccounts.id eq accountId }) {
            it[baseCash] = newAmount
        }
    }

    fun updateCoinBalance(accountId: Long, coinId: Long, newAmount: BigDecimal, avgBuyPrice: BigDecimal) = transaction {
        val existing = AccountBalances.select {
            (AccountBalances.accountId eq accountId) and (AccountBalances.coinId eq coinId)
        }.singleOrNull()

        if (existing != null) {
            AccountBalances.update({
                (AccountBalances.accountId eq accountId) and (AccountBalances.coinId eq coinId)
            }) {
                it[amount] = newAmount
                it[AccountBalances.avgBuyPrice] = avgBuyPrice
            }
        } else {
            AccountBalances.insert {
                it[AccountBalances.accountId] = accountId
                it[AccountBalances.coinId] = coinId
                it[amount] = newAmount
                it[AccountBalances.avgBuyPrice] = avgBuyPrice
            }
        }
    }

    private fun toVirtualAccount(row: ResultRow) = VirtualAccount(
        id = row[VirtualAccounts.id].value,
        userId = row[VirtualAccounts.userId].value,
        baseCash = row[VirtualAccounts.baseCash],
        createdAt = row[VirtualAccounts.createdAt],
        updatedAt = row[VirtualAccounts.updatedAt]
    )

    private fun toCoinBalance(row: ResultRow) = CoinBalance(
        id = row[AccountBalances.id].value,
        accountId = row[AccountBalances.accountId].value,
        coinId = row[AccountBalances.coinId].value,
        coinSymbol = row[Coins.symbol],
        coinName = row[Coins.name],
        amount = row[AccountBalances.amount],
        avgBuyPrice = row[AccountBalances.avgBuyPrice]
    )
}

// ============================================================================
// Coin Repository
// ============================================================================
class CoinRepository {
    fun findAll(): List<Coin> = transaction {
        Coins.selectAll().map { toCoin(it) }
    }

    fun findAllEnabled(): List<Coin> = transaction {
        Coins.select { Coins.isEnabled eq true }.map { toCoin(it) }
    }

    fun findById(id: Long): Coin? = transaction {
        Coins.select { Coins.id eq id }
            .map { toCoin(it) }
            .singleOrNull()
    }

    fun findBySymbol(symbol: String): Coin? = transaction {
        Coins.select { Coins.symbol eq symbol }
            .map { toCoin(it) }
            .singleOrNull()
    }

    private fun toCoin(row: ResultRow) = Coin(
        id = row[Coins.id].value,
        symbol = row[Coins.symbol],
        name = row[Coins.name],
        chain = "ethereum-sepolia", // default chain
        contractAddress = null, // no contract address for coins
        decimals = 18, // standard ETH decimals
        isEnabled = row[Coins.isEnabled],
        iconUrl = null,
        coingeckoId = row[Coins.geckoId],
        createdAt = row[Coins.createdAt]
    )
}

// ============================================================================
// Price Repository
// ============================================================================
class PriceRepository {
    fun insertSnapshot(
        coinId: Long,
        price: BigDecimal,
        volume24h: BigDecimal,
        high24h: BigDecimal,
        low24h: BigDecimal,
        change24hPct: BigDecimal,
        marketCap: BigDecimal?
    ) = transaction {
        PriceSnapshots.insert {
            it[PriceSnapshots.coinId] = coinId
            it[PriceSnapshots.price] = price
            it[PriceSnapshots.volume24h] = volume24h
            it[PriceSnapshots.high24h] = high24h
            it[PriceSnapshots.low24h] = low24h
            it[PriceSnapshots.change24hPct] = change24hPct
            it[PriceSnapshots.marketCap] = marketCap
        }
    }

    fun getLatestPrice(coinId: Long): PriceSnapshot? = transaction {
        PriceSnapshots.select { PriceSnapshots.coinId eq coinId }
            .orderBy(PriceSnapshots.timestamp, SortOrder.DESC)
            .limit(1)
            .map { toPriceSnapshot(it) }
            .singleOrNull()
    }

    fun getPriceHistory(coinId: Long, limit: Int = 100): List<PriceSnapshot> = transaction {
        PriceSnapshots.select { PriceSnapshots.coinId eq coinId }
            .orderBy(PriceSnapshots.timestamp, SortOrder.DESC)
            .limit(limit)
            .map { toPriceSnapshot(it) }
    }

    private fun toPriceSnapshot(row: ResultRow) = PriceSnapshot(
        id = row[PriceSnapshots.id].value,
        coinId = row[PriceSnapshots.coinId].value,
        price = row[PriceSnapshots.price],
        volume24h = row[PriceSnapshots.volume24h] ?: BigDecimal.ZERO,
        high24h = row[PriceSnapshots.high24h] ?: BigDecimal.ZERO,
        low24h = row[PriceSnapshots.low24h] ?: BigDecimal.ZERO,
        change24hPct = row[PriceSnapshots.change24hPct] ?: BigDecimal.ZERO,
        marketCap = row[PriceSnapshots.marketCap],
        timestamp = row[PriceSnapshots.timestamp]
    )
}

// ============================================================================
// Order Repository
// ============================================================================
class OrderRepository {
    fun create(
        userId: Long,
        coinId: Long,
        side: String,
        type: String,
        price: BigDecimal?,
        quantity: BigDecimal
    ): Long = transaction {
        // Get the user's virtual account
        val accountId = VirtualAccounts.select { VirtualAccounts.userId eq userId }
            .map { it[VirtualAccounts.id].value }
            .first()

        Orders.insertAndGetId {
            it[Orders.userId] = userId
            it[Orders.accountId] = accountId
            it[Orders.coinId] = coinId
            it[Orders.side] = side
            it[Orders.orderType] = type
            it[Orders.limitPrice] = price
            it[Orders.quantity] = quantity
            it[Orders.status] = "PENDING"
        }.value
    }

    fun updateStatus(orderId: Long, newStatus: String) = transaction {
        Orders.update({ Orders.id eq orderId }) {
            it[status] = newStatus
        }
    }

    fun findById(id: Long): Order? = transaction {
        Orders.select { Orders.id eq id }
            .map { toOrder(it) }
            .singleOrNull()
    }

    fun findByUserId(userId: Long, limit: Int = 50): List<Order> = transaction {
        Orders.select { Orders.userId eq userId }
            .orderBy(Orders.createdAt, SortOrder.DESC)
            .limit(limit)
            .map { toOrder(it) }
    }

    private fun toOrder(row: ResultRow) = Order(
        id = row[Orders.id].value,
        userId = row[Orders.userId].value,
        coinId = row[Orders.coinId].value,
        side = row[Orders.side],
        type = row[Orders.orderType],
        price = row[Orders.executedPrice],
        quantity = row[Orders.quantity],
        status = row[Orders.status],
        createdAt = row[Orders.createdAt],
        updatedAt = row[Orders.createdAt] // no updatedAt column, use createdAt
    )
}

// ============================================================================
// Trade Repository
// ============================================================================
class TradeRepository {
    fun create(
        orderId: Long,
        userId: Long,
        coinId: Long,
        fillPrice: BigDecimal,
        quantity: BigDecimal,
        feeAmount: BigDecimal,
        side: String
    ): Long = transaction {
        Trades.insertAndGetId {
            it[Trades.orderId] = orderId
            it[Trades.userId] = userId
            it[Trades.coinId] = coinId
            it[Trades.price] = fillPrice
            it[Trades.quantity] = quantity
            it[Trades.fee] = feeAmount
            it[Trades.side] = side
            it[Trades.total] = fillPrice.multiply(quantity).add(feeAmount)
        }.value
    }

    fun findByUserId(userId: Long, limit: Int = 100): List<Trade> = transaction {
        Trades.select { Trades.userId eq userId }
            .orderBy(Trades.createdAt, SortOrder.DESC)
            .limit(limit)
            .map { toTrade(it) }
    }

    fun findByCoinId(coinId: Long, limit: Int = 100): List<Trade> = transaction {
        Trades.select { Trades.coinId eq coinId }
            .orderBy(Trades.createdAt, SortOrder.DESC)
            .limit(limit)
            .map { toTrade(it) }
    }

    private fun toTrade(row: ResultRow) = Trade(
        id = row[Trades.id].value,
        orderId = row[Trades.orderId].value,
        userId = row[Trades.userId].value,
        coinId = row[Trades.coinId].value,
        fillPrice = row[Trades.price],
        quantity = row[Trades.quantity],
        feeAmount = row[Trades.fee],
        side = row[Trades.side],
        createdAt = row[Trades.createdAt]
    )
}

// ============================================================================
// NFT Repository
// ============================================================================
class NFTRepository {
    fun findContractById(id: Long): NFTContract? = transaction {
        NFTContracts.select { NFTContracts.id eq id }
            .map { toNFTContract(it) }
            .singleOrNull()
    }

    fun findTokenById(id: Long): NFTToken? = transaction {
        NFTTokens.select { NFTTokens.id eq id }
            .map { toNFTToken(it) }
            .singleOrNull()
    }

    fun findTokenByContractAndTokenId(contractId: Long, tokenId: String): NFTToken? = transaction {
        NFTTokens.select {
            (NFTTokens.contractId eq contractId) and
            (NFTTokens.tokenId eq tokenId)
        }
            .map { toNFTToken(it) }
            .singleOrNull()
    }

    fun findAvailableTokens(): List<NFTToken> = transaction {
        NFTTokens.select { NFTTokens.status eq "VAULT" }
            .map { toNFTToken(it) }
    }

    fun findInventoryById(id: Long): UserNFTInventory? = transaction {
        UserNFTInventories.select { UserNFTInventories.id eq id }
            .map { toInventory(it) }
            .singleOrNull()
    }

    fun findInventoryByTokenId(tokenId: Long): UserNFTInventory? = transaction {
        UserNFTInventories.select { UserNFTInventories.nftTokenId eq tokenId }
            .map { toInventory(it) }
            .singleOrNull()
    }

    fun findInventoryByUserAndToken(userId: Long, tokenId: Long): UserNFTInventory? = transaction {
        UserNFTInventories.select {
            (UserNFTInventories.userId eq userId) and
            (UserNFTInventories.nftTokenId eq tokenId)
        }
            .map { toInventory(it) }
            .singleOrNull()
    }

    fun findInventoriesByUserId(userId: Long): List<UserNFTInventory> = transaction {
        UserNFTInventories.select { UserNFTInventories.userId eq userId }
            .map { toInventory(it) }
    }

    private fun toNFTContract(row: ResultRow) = NFTContract(
        id = row[NFTContracts.id].value,
        chain = row[NFTContracts.chainName],
        contractAddress = row[NFTContracts.contractAddress],
        name = row[NFTContracts.name],
        symbol = row[NFTContracts.symbol],
        ownerWallet = "0x0000000000000000000000000000000000000000", // not stored in table
        vaultWallet = System.getenv("VAULT_PRIVATE_KEY") ?: "", // from env
        isOfficial = row[NFTContracts.isOfficial],
        createdAt = row[NFTContracts.createdAt]
    )

    private fun toNFTToken(row: ResultRow) = NFTToken(
        id = row[NFTTokens.id].value,
        contractId = row[NFTTokens.contractId].value,
        tokenId = row[NFTTokens.tokenId],
        metadataUri = row[NFTTokens.metadataUrl] ?: "",
        name = row[NFTTokens.name],
        description = row[NFTTokens.description],
        imageUrl = row[NFTTokens.imageUrl] ?: "",
        attributes = null, // not stored in table
        onchainOwner = row[NFTTokens.currentOwner] ?: "",
        status = row[NFTTokens.status],
        createdAt = row[NFTTokens.createdAt],
        updatedAt = row[NFTTokens.createdAt] // no updatedAt column
    )

    private fun toInventory(row: ResultRow) = UserNFTInventory(
        id = row[UserNFTInventories.id].value,
        userId = row[UserNFTInventories.userId].value,
        nftTokenId = row[UserNFTInventories.nftTokenId].value,
        purchasePrice = row[UserNFTInventories.purchasePrice],
        status = row[UserNFTInventories.status],
        createdAt = row[UserNFTInventories.acquiredAt],
        updatedAt = row[UserNFTInventories.acquiredAt] // no updatedAt column
    )
}

// ============================================================================
// Withdrawal Repository
// ============================================================================
class WithdrawalRepository {
    fun findById(id: Long): NFTWithdrawalRequest? = transaction {
        NFTWithdrawalRequests.select { NFTWithdrawalRequests.id eq id }
            .map { toWithdrawal(it) }
            .singleOrNull()
    }

    fun findByStatus(status: String): List<NFTWithdrawalRequest> = transaction {
        NFTWithdrawalRequests.select { NFTWithdrawalRequests.status eq status }
            .map { toWithdrawal(it) }
    }

    fun findPendingRequests(): List<NFTWithdrawalRequest> = findByStatus("PENDING")

    fun findByUserId(userId: Long): List<NFTWithdrawalRequest> = transaction {
        NFTWithdrawalRequests.select { NFTWithdrawalRequests.userId eq userId }
            .orderBy(NFTWithdrawalRequests.requestedAt, SortOrder.DESC)
            .map { toWithdrawal(it) }
    }

    private fun toWithdrawal(row: ResultRow) = NFTWithdrawalRequest(
        id = row[NFTWithdrawalRequests.id].value,
        userId = row[NFTWithdrawalRequests.userId].value,
        nftTokenId = row[NFTWithdrawalRequests.nftTokenId].value,
        targetWallet = row[NFTWithdrawalRequests.targetWallet],
        status = row[NFTWithdrawalRequests.status],
        txHash = row[NFTWithdrawalRequests.txHash],
        gasFee = null, // not stored in table
        adminNote = row[NFTWithdrawalRequests.failureReason], // use failureReason as adminNote
        createdAt = row[NFTWithdrawalRequests.requestedAt],
        updatedAt = row[NFTWithdrawalRequests.completedAt] ?: row[NFTWithdrawalRequests.requestedAt]
    )
}

// ============================================================================
// Onchain Repository
// ============================================================================
class OnchainRepository {
    fun insertMetric(
        chainName: String,
        latestBlockNumber: Long,
        txCount24h: Long,
        activeAddresses24h: Long?,
        avgGasPrice: BigDecimal?,
        totalValue24h: BigDecimal?
    ) = transaction {
        OnchainMetrics.insert {
            it[OnchainMetrics.chainName] = chainName
            it[OnchainMetrics.latestBlockNumber] = latestBlockNumber
            it[OnchainMetrics.txCount24h] = txCount24h
            it[OnchainMetrics.avgGasPrice] = avgGasPrice ?: BigDecimal.ZERO
            // activeAddresses24h and totalValue24h not in table schema
        }
    }

    fun getLatestMetric(chainName: String): OnchainMetric? = transaction {
        OnchainMetrics.select { OnchainMetrics.chainName eq chainName }
            .orderBy(OnchainMetrics.timestamp, SortOrder.DESC)
            .limit(1)
            .map { toMetric(it) }
            .singleOrNull()
    }

    private fun toMetric(row: ResultRow) = OnchainMetric(
        id = row[OnchainMetrics.id].value,
        chainName = row[OnchainMetrics.chainName],
        latestBlockNumber = row[OnchainMetrics.latestBlockNumber],
        txCount24h = row[OnchainMetrics.txCount24h],
        activeAddresses24h = null, // not in table schema
        avgGasPrice = row[OnchainMetrics.avgGasPrice],
        totalValue24h = null, // not in table schema
        timestamp = row[OnchainMetrics.timestamp]
    )
}
