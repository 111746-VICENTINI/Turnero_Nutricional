package nutricentro.entities;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import nutricentro.enums.TokenType;

import java.time.LocalDateTime;

@Entity
@Table(name = "tokens")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class TokenEntity extends BaseEntity {

    public static final int TOKEN_LENGTH = 64;

    public static final int TOKEN_TYPE_LENGTH = 50;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    @Column(name = "token", nullable = false, length = TOKEN_LENGTH)
    private String token;

    @Enumerated(EnumType.STRING)
    @Column(name = "token_type", nullable = false, length = TOKEN_TYPE_LENGTH)
    private TokenType tokenType;

    @Column(name = "expires_datetime", nullable = false)
    private LocalDateTime expiresAt;

    @Builder.Default
    @Column(name = "is_used", nullable = false)
    private Boolean isUsed = false;

    @Column(name = "used_datetime")
    private LocalDateTime usedAt;

}
