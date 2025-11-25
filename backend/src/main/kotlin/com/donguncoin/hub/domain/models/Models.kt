package com.donguncoin.hub.domain.models

import kotlinx.serialization.Serializable
import kotlinx.serialization.KSerializer
import kotlinx.serialization.descriptors.PrimitiveKind
import kotlinx.serialization.descriptors.PrimitiveSerialDescriptor
import kotlinx.serialization.descriptors.SerialDescriptor
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder
import java.math.BigDecimal
import java.time.Instant

// User 도메인
@Serializable
data class User(
    val id: Long,
    val email: String,
    val passwordHash: String,
    val nickname: String,
    val role: String,
    val isActive: Boolean,
    @Serializable(with = InstantSerializer::class)
    val createdAt: Instant,
    @Serializable(with = InstantSerializer::class)
    val updatedAt: Instant
)

@Serializable
data class VirtualAccount(
    val id: Long,
    val userId: Long,
    @Serializable(with = BigDecimalSerializer::class)
    val baseCash: BigDecimal,
    @Serializable(with = InstantSerializer::class)
    val createdAt: Instant,
    @Serializable(with = InstantSerializer::class)
    val updatedAt: Instant
)

@Serializable
data class CoinBalance(
    val id: Long,
    val accountId: Long,
    val coinId: Long,
    val coinSymbol: String,
    val coinName: String,
    @Serializable(with = BigDecimalSerializer::class)
    val amount: BigDecimal,
    @Serializable(with = BigDecimalSerializer::class)
    val avgBuyPrice: BigDecimal
)

// Coin 도메인
@Serializable
data class Coin(
    val id: Long,
    val symbol: String,
    val name: String,
    val chain: String,
    val contractAddress: String? = null,
    val decimals: Int,
    val isEnabled: Boolean,
    val iconUrl: String? = null,
    val coingeckoId: String? = null,
    @Serializable(with = InstantSerializer::class)
    val createdAt: Instant
)

@Serializable
data class PriceSnapshot(
    val id: Long,
    val coinId: Long,
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
    val marketCap: BigDecimal? = null,
    @Serializable(with = InstantSerializer::class)
    val timestamp: Instant
)

// Trading 도메인
@Serializable
data class Order(
    val id: Long,
    val userId: Long,
    val coinId: Long,
    val side: String,
    val type: String,
    @Serializable(with = BigDecimalSerializer::class)
    val price: BigDecimal? = null,
    @Serializable(with = BigDecimalSerializer::class)
    val quantity: BigDecimal,
    val status: String,
    @Serializable(with = InstantSerializer::class)
    val createdAt: Instant,
    @Serializable(with = InstantSerializer::class)
    val updatedAt: Instant
)

@Serializable
data class Trade(
    val id: Long,
    val orderId: Long,
    val userId: Long,
    val coinId: Long,
    @Serializable(with = BigDecimalSerializer::class)
    val fillPrice: BigDecimal,
    @Serializable(with = BigDecimalSerializer::class)
    val quantity: BigDecimal,
    @Serializable(with = BigDecimalSerializer::class)
    val feeAmount: BigDecimal,
    val side: String,
    @Serializable(with = InstantSerializer::class)
    val createdAt: Instant
)

// NFT 도메인
@Serializable
data class NFTContract(
    val id: Long,
    val chain: String,
    val contractAddress: String,
    val name: String,
    val symbol: String,
    val ownerWallet: String,
    val vaultWallet: String,
    val isOfficial: Boolean,
    @Serializable(with = InstantSerializer::class)
    val createdAt: Instant
)

@Serializable
data class NFTToken(
    val id: Long,
    val contractId: Long,
    val tokenId: String,
    val metadataUri: String,
    val name: String,
    val description: String? = null,
    val imageUrl: String,
    val attributes: String? = null,
    val onchainOwner: String,
    val status: String,
    @Serializable(with = InstantSerializer::class)
    val createdAt: Instant,
    @Serializable(with = InstantSerializer::class)
    val updatedAt: Instant
)

@Serializable
data class UserNFTInventory(
    val id: Long,
    val userId: Long,
    val nftTokenId: Long,
    @Serializable(with = BigDecimalSerializer::class)
    val purchasePrice: BigDecimal,
    val status: String,
    @Serializable(with = InstantSerializer::class)
    val createdAt: Instant,
    @Serializable(with = InstantSerializer::class)
    val updatedAt: Instant
)

@Serializable
data class NFTWithdrawalRequest(
    val id: Long,
    val userId: Long,
    val nftTokenId: Long,
    val targetWallet: String,
    val status: String,
    val txHash: String? = null,
    @Serializable(with = BigDecimalSerializer::class)
    val gasFee: BigDecimal? = null,
    val adminNote: String? = null,
    @Serializable(with = InstantSerializer::class)
    val createdAt: Instant,
    @Serializable(with = InstantSerializer::class)
    val updatedAt: Instant
)

// Onchain 도메인
@Serializable
data class OnchainMetric(
    val id: Long,
    val chainName: String,
    val latestBlockNumber: Long,
    val txCount24h: Long,
    val activeAddresses24h: Long? = null,
    @Serializable(with = BigDecimalSerializer::class)
    val avgGasPrice: BigDecimal? = null,
    @Serializable(with = BigDecimalSerializer::class)
    val totalValue24h: BigDecimal? = null,
    @Serializable(with = InstantSerializer::class)
    val timestamp: Instant
)

// Serializers
object BigDecimalSerializer : KSerializer<BigDecimal> {
    override val descriptor: SerialDescriptor = PrimitiveSerialDescriptor("BigDecimal", PrimitiveKind.STRING)
    override fun serialize(encoder: Encoder, value: BigDecimal) = encoder.encodeString(value.toPlainString())
    override fun deserialize(decoder: Decoder): BigDecimal = BigDecimal(decoder.decodeString())
}

object InstantSerializer : KSerializer<Instant> {
    override val descriptor: SerialDescriptor = PrimitiveSerialDescriptor("Instant", PrimitiveKind.STRING)
    override fun serialize(encoder: Encoder, value: Instant) = encoder.encodeString(value.toString())
    override fun deserialize(decoder: Decoder): Instant = Instant.parse(decoder.decodeString())
}
