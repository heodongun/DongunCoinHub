package com.donguncoin.hub.domain.services

import com.donguncoin.hub.data.repositories.*
import com.donguncoin.hub.data.tables.*
import com.donguncoin.hub.domain.models.*
import com.donguncoin.hub.utils.JwtUtil
import com.donguncoin.hub.utils.PasswordUtil
import kotlinx.serialization.Serializable
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.transactions.transaction
import io.ktor.client.*
import io.ktor.client.engine.cio.*
import io.ktor.client.plugins.contentnegotiation.*
import io.ktor.client.request.*
import io.ktor.client.statement.*
import io.ktor.serialization.kotlinx.json.*
import java.math.BigDecimal
import java.math.RoundingMode

// ============================================================================
// Auth Service
// ============================================================================
class AuthService(private val userRepository: UserRepository) {

    @Serializable
    data class RegisterRequest(
        val email: String,
        val password: String,
        val nickname: String
    )

    @Serializable
    data class LoginRequest(
        val email: String,
        val password: String
    )

    @Serializable
    data class AuthResponse(
        val accessToken: String,
        val refreshToken: String,
        val userId: Long,
        val email: String,
        val nickname: String
    )

    fun register(request: RegisterRequest): Result<AuthResponse> {
        if (userRepository.findByEmail(request.email) != null) {
            return Result.failure(Exception("Email already exists"))
        }

        if (userRepository.findByNickname(request.nickname) != null) {
            return Result.failure(Exception("Nickname already exists"))
        }

        val hashedPassword = PasswordUtil.hashPassword(request.password)

        val user = userRepository.createUser(
            email = request.email,
            passwordHash = hashedPassword,
            nickname = request.nickname
        ) ?: return Result.failure(Exception("Failed to create user"))

        val accessToken = JwtUtil.generateAccessToken(user.id, user.email)
        val refreshToken = JwtUtil.generateRefreshToken(user.id)

        return Result.success(
            AuthResponse(
                accessToken = accessToken,
                refreshToken = refreshToken,
                userId = user.id,
                email = user.email,
                nickname = user.nickname
            )
        )
    }

    fun login(request: LoginRequest): Result<AuthResponse> {
        val user = userRepository.findByEmail(request.email)
            ?: return Result.failure(Exception("Invalid credentials"))

        if (!PasswordUtil.verifyPassword(request.password, user.passwordHash)) {
            return Result.failure(Exception("Invalid credentials"))
        }

        if (!user.isActive) {
            return Result.failure(Exception("Account is deactivated"))
        }

        val accessToken = JwtUtil.generateAccessToken(user.id, user.email)
        val refreshToken = JwtUtil.generateRefreshToken(user.id)

        return Result.success(
            AuthResponse(
                accessToken = accessToken,
                refreshToken = refreshToken,
                userId = user.id,
                email = user.email,
                nickname = user.nickname
            )
        )
    }
}

// ============================================================================
// Account Service
// ============================================================================
class AccountService(
    private val accountRepository: AccountRepository,
    private val coinRepository: CoinRepository,
    private val priceRepository: PriceRepository
) {

    @Serializable
    data class AccountSummary(
        val baseCash: String,
        val totalAssetValue: String,
        val coinCount: Int,
        val balances: List<BalanceWithPrice>
    )

    @Serializable
    data class BalanceWithPrice(
        val coinSymbol: String,
        val coinName: String,
        val amount: String,
        val avgBuyPrice: String,
        val currentPrice: String,
        val value: String,
        val profitLoss: String,
        val profitLossPercent: String
    )

    fun getAccountSummary(userId: Long): AccountSummary? {
        val account = accountRepository.getAccountByUserId(userId) ?: return null
        val balances = accountRepository.getBalances(account.id)

        val balancesWithPrice = balances.mapNotNull { balance ->
            val currentPrice = priceRepository.getLatestPrice(balance.coinId)?.price
                ?: return@mapNotNull null

            val value = balance.amount * currentPrice
            val cost = balance.amount * balance.avgBuyPrice
            val profitLoss = value - cost
            val profitLossPercent = if (cost > BigDecimal.ZERO) {
                (profitLoss / cost * BigDecimal("100"))
            } else BigDecimal.ZERO

            BalanceWithPrice(
                coinSymbol = balance.coinSymbol,
                coinName = balance.coinName,
                amount = balance.amount.toPlainString(),
                avgBuyPrice = balance.avgBuyPrice.toPlainString(),
                currentPrice = currentPrice.toPlainString(),
                value = value.toPlainString(),
                profitLoss = profitLoss.toPlainString(),
                profitLossPercent = profitLossPercent.setScale(2, RoundingMode.HALF_UP).toPlainString()
            )
        }

        val totalCoinValue = balancesWithPrice
            .map { BigDecimal(it.value) }
            .fold(BigDecimal.ZERO) { acc, value -> acc + value }

        val totalAssetValue = account.baseCash + totalCoinValue

        return AccountSummary(
            baseCash = account.baseCash.toPlainString(),
            totalAssetValue = totalAssetValue.toPlainString(),
            coinCount = balances.size,
            balances = balancesWithPrice
        )
    }
}

// ============================================================================
// Market Service
// ============================================================================
class MarketService(
    private val coinRepository: CoinRepository,
    private val priceRepository: PriceRepository
) {
    // Simple in-memory cache: geckoId -> (CoinTicker, timestamp)
    private val priceCache = mutableMapOf<String, Pair<CoinTicker, Long>>()
    private val CACHE_TTL_MS = 60_000L // 1 minute cache

    @Serializable
    data class CoinTicker(
        val symbol: String,
        val name: String,
        val price: String,
        val volume24h: String,
        val high24h: String,
        val low24h: String,
        val change24hPct: String
    )

    suspend fun getAllTickers(): List<CoinTicker> {
        val coins = coinRepository.findAllEnabled()

        return coins.mapNotNull { coin ->
            // Try to get real-time price from CoinGecko
            val realTimePrice = try {
                fetchRealTimePrice(coin.coingeckoId)
            } catch (e: Exception) {
                null
            }

            if (realTimePrice != null) {
                CoinTicker(
                    symbol = coin.symbol,
                    name = coin.name,
                    price = realTimePrice.price,
                    volume24h = realTimePrice.volume24h,
                    high24h = realTimePrice.high24h,
                    low24h = realTimePrice.low24h,
                    change24hPct = realTimePrice.change24hPct
                )
            } else {
                // Fallback to database price
                println("💾 Using database fallback price for ${coin.symbol}")
                val priceSnapshot = priceRepository.getLatestPrice(coin.id)
                    ?: return@mapNotNull null

                CoinTicker(
                    symbol = coin.symbol,
                    name = coin.name,
                    price = priceSnapshot.price.toPlainString(),
                    volume24h = priceSnapshot.volume24h.toPlainString(),
                    high24h = priceSnapshot.high24h.toPlainString(),
                    low24h = priceSnapshot.low24h.toPlainString(),
                    change24hPct = priceSnapshot.change24hPct.toPlainString()
                )
            }
        }
    }

    private suspend fun fetchRealTimePrice(geckoId: String?): CoinTicker? {
        if (geckoId == null) return null

        // Check cache first
        val now = System.currentTimeMillis()
        priceCache[geckoId]?.let { (cached, timestamp) ->
            if (now - timestamp < CACHE_TTL_MS) {
                println("📦 Using cached price for $geckoId")
                return cached
            }
        }

        return try {
            val client = io.ktor.client.HttpClient(io.ktor.client.engine.cio.CIO) {
                install(io.ktor.client.plugins.contentnegotiation.ContentNegotiation) {
                    json()
                }
            }

            val url = "https://api.coingecko.com/api/v3/simple/price?" +
                    "ids=$geckoId&" +
                    "vs_currencies=krw&" +
                    "include_24hr_vol=true&" +
                    "include_24hr_change=true&" +
                    "include_last_updated_at=true"

            val response = client.get(url)
            val jsonString = response.bodyAsText()

            client.close()

            // Parse JSON response manually
            val priceRegex = """"krw":\s*(\d+\.?\d*)""".toRegex()
            val volumeRegex = """"krw_24h_vol":\s*(\d+\.?\d*)""".toRegex()
            val changeRegex = """"krw_24h_change":\s*(-?\d+\.?\d*)""".toRegex()

            val priceMatch = priceRegex.find(jsonString)
            val volumeMatch = volumeRegex.find(jsonString)
            val changeMatch = changeRegex.find(jsonString)

            if (priceMatch != null && volumeMatch != null && changeMatch != null) {
                val price = priceMatch.groupValues[1].toBigDecimal()
                val volume = volumeMatch.groupValues[1].toBigDecimal()
                val change = changeMatch.groupValues[1].toBigDecimal()

                // Estimate high/low from current price and change
                val priceChange = price * (change.abs() / BigDecimal("100"))
                val high = if (change >= BigDecimal.ZERO) price else price + priceChange
                val low = if (change < BigDecimal.ZERO) price else price - priceChange

                val ticker = CoinTicker(
                    symbol = "",
                    name = "",
                    price = price.toPlainString(),
                    volume24h = volume.toPlainString(),
                    high24h = high.toPlainString(),
                    low24h = low.toPlainString(),
                    change24hPct = change.toPlainString()
                )

                // Cache the result
                priceCache[geckoId] = Pair(ticker, System.currentTimeMillis())
                println("✅ Fetched real-time price for $geckoId: ${price.toPlainString()} KRW")

                ticker
            } else {
                println("⚠️ Could not parse CoinGecko response for $geckoId")
                null
            }
        } catch (e: Exception) {
            println("❌ Error fetching price for $geckoId: ${e.message}")
            null
        }
    }

    fun getCoinDetail(symbol: String): CoinTicker? {
        val coin = coinRepository.findBySymbol(symbol) ?: return null
        val priceSnapshot = priceRepository.getLatestPrice(coin.id) ?: return null

        return CoinTicker(
            symbol = coin.symbol,
            name = coin.name,
            price = priceSnapshot.price.toPlainString(),
            volume24h = priceSnapshot.volume24h.toPlainString(),
            high24h = priceSnapshot.high24h.toPlainString(),
            low24h = priceSnapshot.low24h.toPlainString(),
            change24hPct = priceSnapshot.change24hPct.toPlainString()
        )
    }

    fun getCurrentPrice(coinId: Long): BigDecimal? {
        return priceRepository.getLatestPrice(coinId)?.price
    }
}

// ============================================================================
// Trade Service
// ============================================================================
class TradeService(
    private val orderRepository: OrderRepository,
    private val tradeRepository: TradeRepository,
    private val accountRepository: AccountRepository,
    private val coinRepository: CoinRepository,
    private val marketService: MarketService
) {

    private val FEE_RATE = BigDecimal("0.001") // 0.1%

    @Serializable
    data class OrderRequest(
        val userId: Long,
        val coinSymbol: String,
        val side: String,
        val type: String,
        val quantity: String,
        val price: String? = null
    )

    @Serializable
    data class OrderResponse(
        val orderId: Long,
        val status: String,
        val fillPrice: String,
        val quantity: String,
        val feeAmount: String
    )

    fun createOrder(request: OrderRequest): Result<OrderResponse> = transaction {
        val coin = coinRepository.findBySymbol(request.coinSymbol)
            ?: return@transaction Result.failure(Exception("Coin not found"))

        if (!coin.isEnabled) {
            return@transaction Result.failure(Exception("Coin trading is disabled"))
        }

        val account = accountRepository.getAccountByUserId(request.userId)
            ?: return@transaction Result.failure(Exception("Account not found"))

        val quantity = BigDecimal(request.quantity)

        val executionPrice = if (request.type == "MARKET") {
            marketService.getCurrentPrice(coin.id)
                ?: return@transaction Result.failure(Exception("Price not available"))
        } else {
            BigDecimal(request.price ?: return@transaction Result.failure(Exception("Price required for LIMIT order")))
        }

        when (request.side) {
            "BUY" -> executeBuyOrder(account, coin, quantity, executionPrice)
            "SELL" -> executeSellOrder(account, coin, quantity, executionPrice)
            else -> return@transaction Result.failure(Exception("Invalid side"))
        }
    }

    private fun executeBuyOrder(
        account: VirtualAccount,
        coin: Coin,
        quantity: BigDecimal,
        price: BigDecimal
    ): Result<OrderResponse> = transaction {
        val totalCost = quantity * price
        val fee = totalCost * FEE_RATE
        val requiredCash = totalCost + fee

        if (account.baseCash < requiredCash) {
            return@transaction Result.failure(Exception("Insufficient balance"))
        }

        val orderId = orderRepository.create(
            userId = account.userId,
            coinId = coin.id,
            side = "BUY",
            type = "MARKET",
            price = price,
            quantity = quantity
        )

        accountRepository.updateBaseCash(account.id, account.baseCash - requiredCash)

        val currentBalance = accountRepository.getBalance(account.id, coin.id)
        val newAmount = (currentBalance?.amount ?: BigDecimal.ZERO) + quantity
        val newAvgPrice = if (currentBalance != null) {
            val totalValue = (currentBalance.amount * currentBalance.avgBuyPrice) + totalCost
            val totalQuantity = currentBalance.amount + quantity
            totalValue.divide(totalQuantity, 8, RoundingMode.HALF_UP)
        } else {
            price
        }

        accountRepository.updateCoinBalance(account.id, coin.id, newAmount, newAvgPrice)

        tradeRepository.create(
            orderId = orderId,
            userId = account.userId,
            coinId = coin.id,
            fillPrice = price,
            quantity = quantity,
            feeAmount = fee,
            side = "BUY"
        )

        orderRepository.updateStatus(orderId, "FILLED")

        Result.success(
            OrderResponse(
                orderId = orderId,
                status = "FILLED",
                fillPrice = price.toPlainString(),
                quantity = quantity.toPlainString(),
                feeAmount = fee.toPlainString()
            )
        )
    }

    private fun executeSellOrder(
        account: VirtualAccount,
        coin: Coin,
        quantity: BigDecimal,
        price: BigDecimal
    ): Result<OrderResponse> = transaction {
        val currentBalance = accountRepository.getBalance(account.id, coin.id)
            ?: return@transaction Result.failure(Exception("No balance to sell"))

        if (currentBalance.amount < quantity) {
            return@transaction Result.failure(Exception("Insufficient coin balance"))
        }

        val orderId = orderRepository.create(
            userId = account.userId,
            coinId = coin.id,
            side = "SELL",
            type = "MARKET",
            price = price,
            quantity = quantity
        )

        val totalRevenue = quantity * price
        val fee = totalRevenue * FEE_RATE
        val netRevenue = totalRevenue - fee

        accountRepository.updateBaseCash(account.id, account.baseCash + netRevenue)

        val newAmount = currentBalance.amount - quantity
        accountRepository.updateCoinBalance(account.id, coin.id, newAmount, currentBalance.avgBuyPrice)

        tradeRepository.create(
            orderId = orderId,
            userId = account.userId,
            coinId = coin.id,
            fillPrice = price,
            quantity = quantity,
            feeAmount = fee,
            side = "SELL"
        )

        orderRepository.updateStatus(orderId, "FILLED")

        Result.success(
            OrderResponse(
                orderId = orderId,
                status = "FILLED",
                fillPrice = price.toPlainString(),
                quantity = quantity.toPlainString(),
                feeAmount = fee.toPlainString()
            )
        )
    }
}

// ============================================================================
// NFT Service
// ============================================================================
class NFTService(
    private val nftRepository: NFTRepository,
    private val accountRepository: AccountRepository,
    private val withdrawalRepository: WithdrawalRepository
) {

    @Serializable
    data class BuyNFTRequest(
        val userId: Long,
        val nftTokenId: Long,
        val price: String
    )

    @Serializable
    data class WithdrawNFTRequest(
        val userId: Long,
        val nftTokenId: Long,
        val targetWallet: String
    )

    @Serializable
    data class SellNFTRequest(
        val userId: Long,
        val inventoryId: Long,
        val price: String
    )

    @Serializable
    data class MintNFTRequest(
        val contractId: Long,
        val tokenId: String,
        val name: String,
        val description: String?,
        val imageUrl: String?,
        val metadataUrl: String?,
        val rarity: String,
        val price: String
    )

    @Serializable
    data class NFTOrderHistory(
        val orderId: Long,
        val nftTokenId: Long,
        val tokenName: String,
        val imageUrl: String?,
        val rarity: String,
        val price: String,
        val status: String,
        val createdAt: String,
        val buyer: String?
    )

    fun mintNFT(request: MintNFTRequest): Result<NFTToken> = transaction {
        val contract = nftRepository.findContractById(request.contractId)
            ?: return@transaction Result.failure(Exception("Contract not found"))

        val existingToken = nftRepository.findTokenByContractAndTokenId(request.contractId, request.tokenId)
        if (existingToken != null) {
            return@transaction Result.failure(Exception("Token ID already exists for this contract"))
        }

        val price = BigDecimal(request.price)
        if (price <= BigDecimal.ZERO) {
            return@transaction Result.failure(Exception("Price must be greater than 0"))
        }

        val tokenId = NFTTokens.insertAndGetId {
            it[contractId] = request.contractId
            it[NFTTokens.tokenId] = request.tokenId
            it[name] = request.name
            it[description] = request.description
            it[imageUrl] = request.imageUrl
            it[metadataUrl] = request.metadataUrl
            it[rarity] = request.rarity
            it[status] = "VAULT"
            it[currentOwner] = null
        }

        val nftToken = nftRepository.findTokenById(tokenId.value)
            ?: return@transaction Result.failure(Exception("Failed to create NFT token"))

        Result.success(nftToken)
    }

    fun buyNFT(request: BuyNFTRequest): Result<UserNFTInventory> = transaction {
        val nftToken = nftRepository.findTokenById(request.nftTokenId)
            ?: return@transaction Result.failure(Exception("NFT not found"))

        if (nftToken.status != "VAULT") {
            return@transaction Result.failure(Exception("NFT not available for purchase"))
        }

        val existingOwner = nftRepository.findInventoryByTokenId(request.nftTokenId)
        if (existingOwner != null && existingOwner.status != "SOLD") {
            return@transaction Result.failure(Exception("NFT already owned"))
        }

        val account = accountRepository.getAccountByUserId(request.userId)
            ?: return@transaction Result.failure(Exception("Account not found"))

        val price = BigDecimal(request.price)

        if (account.baseCash < price) {
            return@transaction Result.failure(Exception("Insufficient balance"))
        }

        accountRepository.updateBaseCash(account.id, account.baseCash - price)

        val inventoryId = UserNFTInventories.insertAndGetId {
            it[userId] = request.userId
            it[nftTokenId] = request.nftTokenId
            it[purchasePrice] = price
            it[status] = "OWNED"
        }

        val inventory = nftRepository.findInventoryById(inventoryId.value)
            ?: return@transaction Result.failure(Exception("Failed to create inventory"))

        Result.success(inventory)
    }

    fun requestWithdrawal(request: WithdrawNFTRequest): Result<NFTWithdrawalRequest> = transaction {
        val inventory = nftRepository.findInventoryByUserAndToken(request.userId, request.nftTokenId)
            ?: return@transaction Result.failure(Exception("You don't own this NFT"))

        if (inventory.status != "OWNED") {
            return@transaction Result.failure(Exception("NFT is not in OWNED status"))
        }

        if (!request.targetWallet.matches(Regex("^0x[a-fA-F0-9]{40}$"))) {
            return@transaction Result.failure(Exception("Invalid wallet address"))
        }

        val requestId = NFTWithdrawalRequests.insertAndGetId {
            it[userId] = request.userId
            it[nftTokenId] = request.nftTokenId
            it[targetWallet] = request.targetWallet
            it[status] = "PENDING"
        }

        UserNFTInventories.update({ UserNFTInventories.id eq inventory.id }) {
            it[status] = "WITHDRAW_REQUESTED"
        }

        val withdrawalRequest = withdrawalRepository.findById(requestId.value)
            ?: return@transaction Result.failure(Exception("Failed to create withdrawal request"))

        Result.success(withdrawalRequest)
    }

    fun getMyNFTs(userId: Long): List<UserNFTInventory> {
        return nftRepository.findInventoriesByUserId(userId)
    }

    fun getAvailableNFTs(): List<NFTToken> {
        return nftRepository.findAvailableTokens()
    }

    fun sellNFT(request: SellNFTRequest): Result<Long> = transaction {
        val inventory = nftRepository.findInventoryById(request.inventoryId)
            ?: return@transaction Result.failure(Exception("Inventory not found"))

        if (inventory.userId != request.userId) {
            return@transaction Result.failure(Exception("You don't own this NFT"))
        }

        if (inventory.status != "OWNED") {
            return@transaction Result.failure(Exception("NFT is not in OWNED status"))
        }

        val price = BigDecimal(request.price)
        if (price <= BigDecimal.ZERO) {
            return@transaction Result.failure(Exception("Price must be greater than 0"))
        }

        val orderId = NFTOrders.insertAndGetId {
            it[userId] = request.userId
            it[nftTokenId] = inventory.nftTokenId
            it[NFTOrders.price] = price
            it[status] = "ACTIVE"
        }

        UserNFTInventories.update({ UserNFTInventories.id eq request.inventoryId }) {
            it[status] = "LISTED"
        }

        Result.success(orderId.value)
    }

    fun getMyOrderHistory(userId: Long): List<NFTOrderHistory> = transaction {
        NFTOrders
            .innerJoin(NFTTokens, { nftTokenId }, { NFTTokens.id })
            .select { NFTOrders.userId eq userId }
            .orderBy(NFTOrders.createdAt, SortOrder.DESC)
            .map { row ->
                NFTOrderHistory(
                    orderId = row[NFTOrders.id].value,
                    nftTokenId = row[NFTOrders.nftTokenId].value,
                    tokenName = row[NFTTokens.name],
                    imageUrl = row[NFTTokens.imageUrl],
                    rarity = row[NFTTokens.rarity],
                    price = row[NFTOrders.price].toPlainString(),
                    status = row[NFTOrders.status],
                    createdAt = row[NFTOrders.createdAt].toString(),
                    buyer = null
                )
            }
    }
}

// ============================================================================
// Onchain Service
// ============================================================================
class OnchainService(private val onchainRepository: OnchainRepository) {

    @Serializable
    data class ChainMetric(
        val chainName: String,
        val latestBlockNumber: Long,
        val txCount24h: Long,
        val avgGasPrice: String?
    )

    fun getChainMetrics(chainName: String): ChainMetric? {
        val metric = onchainRepository.getLatestMetric(chainName) ?: return null

        return ChainMetric(
            chainName = metric.chainName,
            latestBlockNumber = metric.latestBlockNumber,
            txCount24h = metric.txCount24h,
            avgGasPrice = metric.avgGasPrice?.toPlainString()
        )
    }
}
