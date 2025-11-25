package com.donguncoin.hub.routes

import com.donguncoin.hub.domain.services.*
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.auth.jwt.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import org.koin.ktor.ext.inject

// ============================================================================
// Auth Routes
// ============================================================================
fun Route.authRoutes() {
    val authService by inject<AuthService>()

    route("/api/auth") {
        post("/register") {
            try {
                val request = call.receive<AuthService.RegisterRequest>()

                authService.register(request).fold(
                    onSuccess = { response ->
                        call.respond(HttpStatusCode.Created, response)
                    },
                    onFailure = { error ->
                        call.respond(
                            HttpStatusCode.BadRequest,
                            mapOf("error" to (error.message ?: "Registration failed"))
                        )
                    }
                )
            } catch (e: Exception) {
                call.respond(
                    HttpStatusCode.BadRequest,
                    mapOf("error" to "Invalid request format")
                )
            }
        }

        post("/login") {
            try {
                val request = call.receive<AuthService.LoginRequest>()

                authService.login(request).fold(
                    onSuccess = { response ->
                        call.respond(HttpStatusCode.OK, response)
                    },
                    onFailure = { error ->
                        call.respond(
                            HttpStatusCode.Unauthorized,
                            mapOf("error" to (error.message ?: "Login failed"))
                        )
                    }
                )
            } catch (e: Exception) {
                call.respond(
                    HttpStatusCode.BadRequest,
                    mapOf("error" to "Invalid request format")
                )
            }
        }
    }
}

// ============================================================================
// Account Routes
// ============================================================================
fun Route.accountRoutes() {
    val accountService by inject<AccountService>()

    authenticate("auth-jwt") {
        route("/api/account") {
            get("/summary") {
                val principal = call.principal<JWTPrincipal>()
                val userId = principal?.payload?.getClaim("userId")?.asLong()
                    ?: return@get call.respond(HttpStatusCode.Unauthorized)

                val summary = accountService.getAccountSummary(userId)
                    ?: return@get call.respond(
                        HttpStatusCode.NotFound,
                        mapOf("error" to "Account not found")
                    )

                call.respond(HttpStatusCode.OK, summary)
            }
        }
    }
}

// ============================================================================
// Market Routes
// ============================================================================
fun Route.marketRoutes() {
    val marketService by inject<MarketService>()

    route("/api/market") {
        get("/tickers") {
            try {
                val tickers = marketService.getAllTickers()
                call.respond(HttpStatusCode.OK, tickers)
            } catch (e: Exception) {
                e.printStackTrace()
                call.respond(
                    HttpStatusCode.InternalServerError,
                    mapOf("error" to "Failed to fetch tickers: ${e.message}")
                )
            }
        }

        get("/coins/{symbol}") {
            val symbol = call.parameters["symbol"]?.uppercase()
                ?: return@get call.respond(
                    HttpStatusCode.BadRequest,
                    mapOf("error" to "Symbol required")
                )

            val ticker = marketService.getCoinDetail(symbol)
                ?: return@get call.respond(
                    HttpStatusCode.NotFound,
                    mapOf("error" to "Coin not found")
                )

            call.respond(HttpStatusCode.OK, ticker)
        }
    }
}

// ============================================================================
// Trade Routes
// ============================================================================
fun Route.tradeRoutes() {
    val tradeService by inject<TradeService>()

    authenticate("auth-jwt") {
        route("/api/trade") {
            post("/order") {
                val principal = call.principal<JWTPrincipal>()
                val userId = principal?.payload?.getClaim("userId")?.asLong()
                    ?: return@post call.respond(HttpStatusCode.Unauthorized)

                try {
                    val request = call.receive<TradeService.OrderRequest>()
                    val orderRequest = request.copy(userId = userId)

                    tradeService.createOrder(orderRequest).fold(
                        onSuccess = { response ->
                            call.respond(HttpStatusCode.Created, response)
                        },
                        onFailure = { error ->
                            call.respond(
                                HttpStatusCode.BadRequest,
                                mapOf("error" to (error.message ?: "Order failed"))
                            )
                        }
                    )
                } catch (e: Exception) {
                    call.respond(
                        HttpStatusCode.BadRequest,
                        mapOf("error" to "Invalid request format")
                    )
                }
            }
        }
    }
}

// ============================================================================
// NFT Routes
// ============================================================================
fun Route.nftRoutes() {
    val nftService by inject<NFTService>()

    route("/api/nft") {
        get("/list") {
            try {
                val nfts = nftService.getAvailableNFTs()
                call.respond(HttpStatusCode.OK, nfts)
            } catch (e: Exception) {
                call.respond(
                    HttpStatusCode.InternalServerError,
                    mapOf("error" to "Failed to fetch NFTs")
                )
            }
        }

        authenticate("auth-jwt") {
            post("/mint") {
                val principal = call.principal<JWTPrincipal>()
                val userId = principal?.payload?.getClaim("userId")?.asLong()
                    ?: return@post call.respond(HttpStatusCode.Unauthorized)

                try {
                    val request = call.receive<NFTService.MintNFTRequest>()

                    nftService.mintNFT(request).fold(
                        onSuccess = { nftToken ->
                            call.respond(HttpStatusCode.Created, nftToken)
                        },
                        onFailure = { error ->
                            call.respond(
                                HttpStatusCode.BadRequest,
                                mapOf("error" to (error.message ?: "Minting failed"))
                            )
                        }
                    )
                } catch (e: Exception) {
                    call.respond(
                        HttpStatusCode.BadRequest,
                        mapOf("error" to "Invalid request format")
                    )
                }
            }

            get("/my") {
                val principal = call.principal<JWTPrincipal>()
                val userId = principal?.payload?.getClaim("userId")?.asLong()
                    ?: return@get call.respond(HttpStatusCode.Unauthorized)

                try {
                    val nfts = nftService.getMyNFTs(userId)
                    call.respond(HttpStatusCode.OK, nfts)
                } catch (e: Exception) {
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        mapOf("error" to "Failed to fetch your NFTs")
                    )
                }
            }

            post("/buy") {
                val principal = call.principal<JWTPrincipal>()
                val userId = principal?.payload?.getClaim("userId")?.asLong()
                    ?: return@post call.respond(HttpStatusCode.Unauthorized)

                try {
                    val request = call.receive<NFTService.BuyNFTRequest>()
                    val buyRequest = request.copy(userId = userId)

                    nftService.buyNFT(buyRequest).fold(
                        onSuccess = { inventory ->
                            call.respond(HttpStatusCode.Created, inventory)
                        },
                        onFailure = { error ->
                            call.respond(
                                HttpStatusCode.BadRequest,
                                mapOf("error" to (error.message ?: "Purchase failed"))
                            )
                        }
                    )
                } catch (e: Exception) {
                    call.respond(
                        HttpStatusCode.BadRequest,
                        mapOf("error" to "Invalid request format")
                    )
                }
            }

            post("/withdraw") {
                val principal = call.principal<JWTPrincipal>()
                val userId = principal?.payload?.getClaim("userId")?.asLong()
                    ?: return@post call.respond(HttpStatusCode.Unauthorized)

                try {
                    val request = call.receive<NFTService.WithdrawNFTRequest>()
                    val withdrawRequest = request.copy(userId = userId)

                    nftService.requestWithdrawal(withdrawRequest).fold(
                        onSuccess = { withdrawal ->
                            call.respond(HttpStatusCode.Created, withdrawal)
                        },
                        onFailure = { error ->
                            call.respond(
                                HttpStatusCode.BadRequest,
                                mapOf("error" to (error.message ?: "Withdrawal request failed"))
                            )
                        }
                    )
                } catch (e: Exception) {
                    call.respond(
                        HttpStatusCode.BadRequest,
                        mapOf("error" to "Invalid request format")
                    )
                }
            }

            post("/sell") {
                val principal = call.principal<JWTPrincipal>()
                val userId = principal?.payload?.getClaim("userId")?.asLong()
                    ?: return@post call.respond(HttpStatusCode.Unauthorized)

                try {
                    val request = call.receive<NFTService.SellNFTRequest>()
                    val sellRequest = request.copy(userId = userId)

                    nftService.sellNFT(sellRequest).fold(
                        onSuccess = { orderId ->
                            call.respond(HttpStatusCode.Created, mapOf("orderId" to orderId))
                        },
                        onFailure = { error ->
                            call.respond(
                                HttpStatusCode.BadRequest,
                                mapOf("error" to (error.message ?: "Sell request failed"))
                            )
                        }
                    )
                } catch (e: Exception) {
                    call.respond(
                        HttpStatusCode.BadRequest,
                        mapOf("error" to "Invalid request format")
                    )
                }
            }

            get("/orders") {
                val principal = call.principal<JWTPrincipal>()
                val userId = principal?.payload?.getClaim("userId")?.asLong()
                    ?: return@get call.respond(HttpStatusCode.Unauthorized)

                try {
                    val orders = nftService.getMyOrderHistory(userId)
                    call.respond(HttpStatusCode.OK, orders)
                } catch (e: Exception) {
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        mapOf("error" to "Failed to fetch order history")
                    )
                }
            }
        }
    }
}

// ============================================================================
// Onchain Routes
// ============================================================================
fun Route.onchainRoutes() {
    val onchainService by inject<OnchainService>()

    route("/api/onchain") {
        get("/chains/{chainName}") {
            val chainName = call.parameters["chainName"]
                ?: return@get call.respond(
                    HttpStatusCode.BadRequest,
                    mapOf("error" to "Chain name required")
                )

            val metrics = onchainService.getChainMetrics(chainName)
                ?: return@get call.respond(
                    HttpStatusCode.NotFound,
                    mapOf("error" to "Chain metrics not found")
                )

            call.respond(HttpStatusCode.OK, metrics)
        }
    }
}
