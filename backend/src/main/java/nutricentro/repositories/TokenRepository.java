package nutricentro.repositories;

import nutricentro.entities.TokenEntity;
import nutricentro.enums.TokenType;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface TokenRepository extends JpaRepository<TokenEntity, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<TokenEntity> findByTokenAndTokenType(String token, TokenType tokenType);

    @Modifying
    @Query("""
            update TokenEntity token
            set token.isUsed = true,
                token.usedAt = :usedAt
            where token.user.id = :userId
              and token.tokenType = :tokenType
              and token.isUsed = false
            """)
    int invalidateActiveTokens(@Param("userId") Long userId,
                               @Param("tokenType") TokenType tokenType,
                               @Param("usedAt") LocalDateTime usedAt);

    @Modifying
    @Query("""
            update TokenEntity token
            set token.isUsed = true,
                token.usedAt = :usedAt
            where token.user.id = :userId
              and token.isUsed = false
            """)
    int invalidateAllActiveTokens(@Param("userId") Long userId,
                                  @Param("usedAt") LocalDateTime usedAt);
}
