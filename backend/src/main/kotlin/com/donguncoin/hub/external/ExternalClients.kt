package com.donguncoin.hub.external

import com.donguncoin.hub.domain.models.BigDecimalSerializer
import io.ktor.client.*
import io.ktor.client.call.*
import io.ktor.client.engine.cio.*
import io.ktor.client.plugins.contentnegotiation.*
import io.ktor.client.request.*
import io.ktor.serialization.kotlinx.json.*
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import java.math.BigDecimal

// ============================================================================
// CoinGecko API Client
// ============================================================================
class CoinGeckoClient {
    private val client = HttpClient(CIO) {
        install(ContentNegotiation) {
            json(Json {
                ignoreUnknownKeys = true
                isLenient = true
            })
        }
    }

    private val baseUrl = "https://api.coingecko.com/api/v3"

    @Serializable
    data class CoinGeckoPrice(
        val id: String,
        val current_price: Double,
        val total_volume: Double,
        val high_24h: Double,
        val low_24h: Double,
        val price_change_percentage_24h: Double,
        val market_cap: Double
    )

    @Serializable
    data class PriceData(
        @Serializable(with = BigDecimalSerializer::class)
        val price: BigDecimal,
        @Serializable(with = BigDecimalSerializer::class)
        val volume24h: BigDecimal,
        @Serializable(with = BigDecimalSerializer::class)
        val high24h: BigDecimal,
        @Serializable(with = BigDecimalSerializer::class)
        val low24h: BigDecimal,
        @Serializable(with = BigDecimalSerializer::class)
        val change24hPct: BigDecimal,
        @Serializable(with = BigDecimalSerializer::class)
        val marketCap: BigDecimal
    )

    suspend fun getPrice(coinId: String): PriceData {
        try {
            val response: List<CoinGeckoPrice> = client.get("$baseUrl/coins/markets") {
                parameter("vs_currency", "krw")
                parameter("ids", coinId)
                parameter("order", "market_cap_desc")
                parameter("per_page", "1")
                parameter("page", "1")
                parameter("sparkline", "false")
            }.body()

            val coin = response.firstOrNull()
                ?: throw Exception("Coin not found: $coinId")

            return PriceData(
                price = BigDecimal(coin.current_price),
                volume24h = BigDecimal(coin.total_volume),
                high24h = BigDecimal(coin.high_24h),
                low24h = BigDecimal(coin.low_24h),
                change24hPct = BigDecimal(coin.price_change_percentage_24h),
                marketCap = BigDecimal(coin.market_cap)
            )
        } catch (e: Exception) {
            // 에러 시 더미 데이터 (실제로는 로깅 및 재시도 로직 필요)
            return PriceData(
                price = BigDecimal("50000"),
                volume24h = BigDecimal("1000000"),
                high24h = BigDecimal("51000"),
                low24h = BigDecimal("49000"),
                change24hPct = BigDecimal("2.5"),
                marketCap = BigDecimal("10000000")
            )
        }
    }
}

// ============================================================================
// Etherscan API Client (Simplified)
// ============================================================================
class EtherscanClient {
    private val client = HttpClient(CIO) {
        install(ContentNegotiation) {
            json()
        }
    }

    private val baseUrl = "https://api-sepolia.etherscan.io/api"
    private val apiKey = System.getenv("ETHERSCAN_API_KEY") ?: ""

    suspend fun getLatestBlockNumber(): Long {
        return try {
            // 실제 API 호출 (키 필요)
            1000000L // 더미 값
        } catch (e: Exception) {
            1000000L
        }
    }

    suspend fun getGasPrice(): BigDecimal {
        return BigDecimal("20.5") // Gwei
    }
}

// ============================================================================
// Web3 Client (Web3j Wrapper)
// ============================================================================
class Web3Client {
    private val rpcUrl = System.getenv("WEB3_RPC_URL") ?: "https://eth-sepolia.g.alchemy.com/v2/demo"
    private val vaultPrivateKey = System.getenv("VAULT_PRIVATE_KEY") ?: ""
    private val nftContractAddress = System.getenv("NFT_CONTRACT_ADDRESS") ?: ""

    suspend fun transferNFT(contractAddress: String, tokenId: String, toAddress: String): String {
        // 실제 Web3j 구현 (간단한 더미 구현)
        // 실제로는 Web3j를 사용해서 트랜잭션 서명 및 전송
        return "0x${generateRandomHex(64)}"
    }

    suspend fun isTransactionConfirmed(txHash: String, minConfirmations: Int = 3): Boolean {
        // 실제로는 트랜잭션 영수증 조회 및 confirm 수 확인
        return true // 더미
    }

    private fun generateRandomHex(length: Int): String {
        val chars = "0123456789abcdef"
        return (1..length)
            .map { chars.random() }
            .joinToString("")
    }
}
