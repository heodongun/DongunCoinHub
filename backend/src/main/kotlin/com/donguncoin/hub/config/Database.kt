package com.donguncoin.hub.config

import com.donguncoin.hub.data.tables.*
import com.zaxxer.hikari.HikariConfig
import com.zaxxer.hikari.HikariDataSource
import io.ktor.server.application.*
import org.jetbrains.exposed.sql.Database
import org.jetbrains.exposed.sql.SchemaUtils
import org.jetbrains.exposed.sql.transactions.transaction

fun Application.configureDatabases() {
    val jdbcUrl = environment.config.propertyOrNull("database.url")?.getString()
        ?: System.getenv("DATABASE_URL")
        ?: "jdbc:postgresql://postgres:5432/donguncoin_hub"

    val user = environment.config.propertyOrNull("database.user")?.getString()
        ?: System.getenv("DATABASE_USER")
        ?: "postgres"

    val password = environment.config.propertyOrNull("database.password")?.getString()
        ?: System.getenv("DATABASE_PASSWORD")
        ?: "postgres"

    val config = HikariConfig().apply {
        this.jdbcUrl = jdbcUrl
        this.username = user
        this.password = password
        maximumPoolSize = 10
        isAutoCommit = false
        transactionIsolation = "TRANSACTION_REPEATABLE_READ"
        validate()
    }

    val dataSource = HikariDataSource(config)
    Database.connect(dataSource)

    // Create tables if not exists
    transaction {
        SchemaUtils.createMissingTablesAndColumns(
            Users,
            VirtualAccounts,
            Coins,
            AccountBalances,
            PriceSnapshots,
            OnchainMetrics,
            Orders,
            Trades,
            NFTContracts,
            NFTTokens,
            UserNFTInventories,
            NFTWithdrawalRequests,
            NFTOrders,
            NFTTrades,
            Watchlists
        )
    }

    log.info("✅ Database configured: $jdbcUrl")
}
