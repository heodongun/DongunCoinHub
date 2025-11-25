package com.donguncoin.hub.config

import com.donguncoin.hub.data.repositories.*
import com.donguncoin.hub.domain.services.*
import com.donguncoin.hub.external.*
import com.donguncoin.hub.workers.WorkerManager
import org.koin.dsl.module

val appModule = module {
    // External Clients
    single { CoinGeckoClient() }
    single { EtherscanClient() }
    single { Web3Client() }

    // Repositories
    single { UserRepository() }
    single { AccountRepository() }
    single { CoinRepository() }
    single { PriceRepository() }
    single { OrderRepository() }
    single { TradeRepository() }
    single { NFTRepository() }
    single { WithdrawalRepository() }
    single { OnchainRepository() }

    // Services - using constructor DI with explicit parameters
    single<AuthService> {
        AuthService(
            userRepository = get()
        )
    }
    single<AccountService> {
        AccountService(
            accountRepository = get(),
            coinRepository = get(),
            priceRepository = get()
        )
    }
    single<MarketService> {
        MarketService(
            coinRepository = get(),
            priceRepository = get()
        )
    }
    single<TradeService> {
        TradeService(
            orderRepository = get(),
            tradeRepository = get(),
            accountRepository = get(),
            coinRepository = get(),
            marketService = get()
        )
    }
    single<NFTService> {
        NFTService(
            nftRepository = get(),
            accountRepository = get(),
            withdrawalRepository = get()
        )
    }
    single<OnchainService> {
        OnchainService(
            onchainRepository = get()
        )
    }

    // Workers - simplified to avoid circular dependency
    // single { WorkerManager(get(), get(), get()) }
}
