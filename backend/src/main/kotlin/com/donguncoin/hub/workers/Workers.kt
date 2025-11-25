package com.donguncoin.hub.workers

import com.donguncoin.hub.data.repositories.*
import com.donguncoin.hub.data.tables.*
import com.donguncoin.hub.external.*
import kotlinx.coroutines.*
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.transactions.transaction
import org.jetbrains.exposed.sql.javatime.CurrentTimestamp
import org.slf4j.LoggerFactory
import java.math.BigDecimal

// ============================================================================
// Price Collector Worker
// ============================================================================
class PriceCollectorWorker(
    private val coinGeckoClient: CoinGeckoClient,
    private val coinRepository: CoinRepository,
    private val priceRepository: PriceRepository
) {
    private val logger = LoggerFactory.getLogger(PriceCollectorWorker::class.java)
    private var job: Job? = null

    fun start(intervalMs: Long = 60_000L) {
        logger.info("🚀 Starting PriceCollectorWorker with interval: ${intervalMs}ms")

        job = CoroutineScope(Dispatchers.IO).launch {
            while (isActive) {
                try {
                    collectPrices()
                } catch (e: Exception) {
                    logger.error("❌ Error collecting prices: ${e.message}", e)
                }
                delay(intervalMs)
            }
        }
    }

    fun stop() {
        logger.info("⏹️ Stopping PriceCollectorWorker")
        job?.cancel()
    }

    private suspend fun collectPrices() {
        val coins = transaction { coinRepository.findAllEnabled() }
        logger.info("📊 Collecting prices for ${coins.size} coins")

        coins.forEach { coin ->
            try {
                val priceData = coinGeckoClient.getPrice(coin.coingeckoId ?: coin.symbol.lowercase())

                transaction {
                    PriceSnapshots.insert {
                        it[coinId] = coin.id
                        it[price] = priceData.price
                        it[volume24h] = priceData.volume24h
                        it[high24h] = priceData.high24h
                        it[low24h] = priceData.low24h
                        it[change24hPct] = priceData.change24hPct
                        it[marketCap] = priceData.marketCap
                    }
                }

                logger.debug("✅ Updated price for ${coin.symbol}: ${priceData.price}")
            } catch (e: Exception) {
                logger.error("❌ Failed to update price for ${coin.symbol}: ${e.message}")
            }
        }
    }
}

// ============================================================================
// Onchain Metrics Worker
// ============================================================================
class OnchainMetricsWorker(
    private val etherscanClient: EtherscanClient,
    private val onchainRepository: OnchainRepository
) {
    private val logger = LoggerFactory.getLogger(OnchainMetricsWorker::class.java)
    private var job: Job? = null

    fun start(intervalMs: Long = 300_000L) { // 5 minutes
        logger.info("🚀 Starting OnchainMetricsWorker with interval: ${intervalMs}ms")

        job = CoroutineScope(Dispatchers.IO).launch {
            while (isActive) {
                try {
                    collectMetrics()
                } catch (e: Exception) {
                    logger.error("❌ Error collecting onchain metrics: ${e.message}", e)
                }
                delay(intervalMs)
            }
        }
    }

    fun stop() {
        logger.info("⏹️ Stopping OnchainMetricsWorker")
        job?.cancel()
    }

    private suspend fun collectMetrics() {
        val chains = listOf("ethereum-sepolia")
        logger.info("⛓️ Collecting metrics for ${chains.size} chains")

        chains.forEach { chainName ->
            try {
                val blockNumber = etherscanClient.getLatestBlockNumber()
                val gasPrice = etherscanClient.getGasPrice()

                transaction {
                    OnchainMetrics.insert {
                        it[OnchainMetrics.chainName] = chainName
                        it[latestBlockNumber] = blockNumber
                        it[txCount24h] = 0L // 더미 데이터
                        it[avgGasPrice] = gasPrice
                    }
                }

                logger.debug("✅ Updated metrics for $chainName: block=$blockNumber, gas=$gasPrice")
            } catch (e: Exception) {
                logger.error("❌ Failed to update metrics for $chainName: ${e.message}")
            }
        }
    }
}

// ============================================================================
// NFT Withdrawal Worker
// ============================================================================
class NFTWithdrawalWorker(
    private val web3Client: Web3Client,
    private val nftRepository: NFTRepository,
    private val withdrawalRepository: WithdrawalRepository
) {
    private val logger = LoggerFactory.getLogger(NFTWithdrawalWorker::class.java)
    private var job: Job? = null

    fun start(intervalMs: Long = 30_000L) { // 30 seconds
        logger.info("🚀 Starting NFTWithdrawalWorker with interval: ${intervalMs}ms")

        job = CoroutineScope(Dispatchers.IO).launch {
            while (isActive) {
                try {
                    processWithdrawals()
                } catch (e: Exception) {
                    logger.error("❌ Error processing withdrawals: ${e.message}", e)
                }
                delay(intervalMs)
            }
        }
    }

    fun stop() {
        logger.info("⏹️ Stopping NFTWithdrawalWorker")
        job?.cancel()
    }

    private suspend fun processWithdrawals() {
        val pendingRequests = transaction {
            withdrawalRepository.findPendingRequests()
        }

        if (pendingRequests.isEmpty()) {
            return
        }

        logger.info("🔄 Processing ${pendingRequests.size} pending withdrawal requests")

        pendingRequests.forEach { request ->
            try {
                processWithdrawal(request)
            } catch (e: Exception) {
                logger.error("❌ Failed to process withdrawal ${request.id}: ${e.message}")

                // Mark as failed (skip if table doesn't exist yet)
                try {
                    transaction {
                        // Simplified: just log the error
                        logger.error("Withdrawal ${request.id} failed: ${e.message}")
                    }
                } catch (ignored: Exception) {
                    // Ignore table errors during development
                }
            }
        }
    }

    private suspend fun processWithdrawal(request: com.donguncoin.hub.domain.models.NFTWithdrawalRequest) {
        logger.info("🚀 Processing withdrawal: NFT=${request.nftTokenId} → Wallet=${request.targetWallet}")

        val nftToken = transaction {
            nftRepository.findTokenById(request.nftTokenId)
        } ?: throw Exception("NFT token not found: ${request.nftTokenId}")

        // Get the contract info
        val contract = transaction {
            nftRepository.findContractById(nftToken.contractId)
        } ?: throw Exception("NFT contract not found")

        // Execute blockchain transfer
        val txHash = web3Client.transferNFT(
            contractAddress = contract.contractAddress,
            tokenId = nftToken.tokenId,
            toAddress = request.targetWallet
        )

        logger.info("📤 Transaction sent: $txHash")

        // Wait for confirmation
        val confirmed = web3Client.isTransactionConfirmed(txHash, minConfirmations = 3)

        if (confirmed) {
            logger.info("✅ Withdrawal completed: ${request.id}")
        } else {
            throw Exception("Transaction not confirmed: $txHash")
        }
    }
}

// ============================================================================
// Worker Manager
// ============================================================================
class WorkerManager(
    private val priceCollectorWorker: PriceCollectorWorker,
    private val onchainMetricsWorker: OnchainMetricsWorker,
    private val nftWithdrawalWorker: NFTWithdrawalWorker
) {
    private val logger = LoggerFactory.getLogger(WorkerManager::class.java)

    fun startAll() {
        logger.info("🚀 Starting all workers")

        priceCollectorWorker.start(intervalMs = 60_000L) // 1 minute
        onchainMetricsWorker.start(intervalMs = 300_000L) // 5 minutes
        nftWithdrawalWorker.start(intervalMs = 30_000L) // 30 seconds

        logger.info("✅ All workers started successfully")
    }

    fun stopAll() {
        logger.info("⏹️ Stopping all workers")

        priceCollectorWorker.stop()
        onchainMetricsWorker.stop()
        nftWithdrawalWorker.stop()

        logger.info("✅ All workers stopped successfully")
    }
}
