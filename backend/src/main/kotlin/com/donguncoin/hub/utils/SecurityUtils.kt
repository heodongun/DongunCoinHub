package com.donguncoin.hub.utils

import com.auth0.jwt.JWT
import com.auth0.jwt.algorithms.Algorithm
import org.mindrot.jbcrypt.BCrypt
import java.util.Date

object PasswordUtil {
    fun hashPassword(password: String): String {
        return BCrypt.hashpw(password, BCrypt.gensalt())
    }

    fun verifyPassword(password: String, hashedPassword: String): Boolean {
        return BCrypt.checkpw(password, hashedPassword)
    }
}

object JwtUtil {
    private val secret: String = System.getenv("JWT_SECRET")?.takeIf { it.isNotBlank() }
        ?: error("JWT_SECRET must be provided in the environment")
    private const val issuer = "donguncoin-hub"
    private const val validityInMs = 900_000L // 15 minutes for access token
    private const val refreshValidityInMs = 604_800_000L // 7 days for refresh token

    fun generateAccessToken(userId: Long, email: String): String {
        return JWT.create()
            .withAudience("donguncoin-users")
            .withIssuer(issuer)
            .withClaim("userId", userId)
            .withClaim("email", email)
            .withClaim("type", "access")
            .withExpiresAt(Date(System.currentTimeMillis() + validityInMs))
            .sign(Algorithm.HMAC256(secret))
    }

    fun generateRefreshToken(userId: Long): String {
        return JWT.create()
            .withAudience("donguncoin-users")
            .withIssuer(issuer)
            .withClaim("userId", userId)
            .withClaim("type", "refresh")
            .withExpiresAt(Date(System.currentTimeMillis() + refreshValidityInMs))
            .sign(Algorithm.HMAC256(secret))
    }

    fun verify(token: String): Long? {
        return try {
            val verifier = JWT.require(Algorithm.HMAC256(secret))
                .withAudience("donguncoin-users")
                .withIssuer(issuer)
                .build()

            val decodedJWT = verifier.verify(token)
            decodedJWT.getClaim("userId").asLong()
        } catch (e: Exception) {
            null
        }
    }
}
