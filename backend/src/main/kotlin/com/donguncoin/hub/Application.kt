package com.donguncoin.hub

import com.donguncoin.hub.config.*
import com.donguncoin.hub.routes.*
import com.donguncoin.hub.workers.WorkerManager
import io.ktor.server.application.*
import io.ktor.server.engine.*
import io.ktor.server.netty.*
import io.ktor.server.plugins.contentnegotiation.*
import io.ktor.server.plugins.cors.routing.*
import io.ktor.server.plugins.statuspages.*
import io.ktor.server.routing.*
import io.ktor.serialization.kotlinx.json.*
import kotlinx.serialization.json.Json
import org.koin.ktor.ext.inject
import org.koin.ktor.plugin.Koin
import io.ktor.http.*
import io.ktor.server.response.*

fun main() {
    embeddedServer(Netty, port = 8080, host = "0.0.0.0", module = Application::module)
        .start(wait = true)
}

fun Application.module() {
    // Koin DI
    install(Koin) {
        modules(appModule)
    }

    // JSON
    install(ContentNegotiation) {
        json(Json {
            prettyPrint = true
            isLenient = true
            ignoreUnknownKeys = true
        })
    }

    // CORS
    install(CORS) {
        anyHost()
        allowHeader(HttpHeaders.ContentType)
        allowHeader(HttpHeaders.Authorization)
        allowMethod(HttpMethod.Options)
        allowMethod(HttpMethod.Get)
        allowMethod(HttpMethod.Post)
        allowMethod(HttpMethod.Put)
        allowMethod(HttpMethod.Delete)
        allowMethod(HttpMethod.Patch)
    }

    // Status Pages
    install(StatusPages) {
        exception<Throwable> { call, cause ->
            call.application.log.error("Unhandled exception", cause)
            call.respond(
                HttpStatusCode.InternalServerError,
                mapOf("error" to (cause.message ?: "Internal server error"))
            )
        }
    }

    // Database
    configureDatabases()

    // Security
    configureSecurity()

    // Routes
    routing {
        route("/api/health") {
            get {
                call.respond(HttpStatusCode.OK, mapOf("status" to "healthy"))
            }
        }
        authRoutes()
        accountRoutes()
        marketRoutes()
        tradeRoutes()
        nftRoutes()
        onchainRoutes()
    }

    // Workers temporarily disabled to avoid compilation issues
    // val workerManager by inject<WorkerManager>()
    // workerManager.startAll()

    // environment.monitor.subscribe(ApplicationStopping) {
    //     workerManager.stopAll()
    // }
}
