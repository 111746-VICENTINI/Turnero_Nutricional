package nutricentro.repositories;

import nutricentro.entities.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<UserEntity, Long>, JpaSpecificationExecutor<UserEntity> {
    Optional<UserEntity> findByUsernameIgnoreCase(String username);
    Optional<UserEntity> findByEmailIgnoreCase(String email);
    boolean existsByUsernameIgnoreCase(String username);
    boolean existsByEmailIgnoreCase(String email);
    boolean existsByUsernameIgnoreCaseAndIdNot(String username, Long id);
    boolean existsByEmailIgnoreCaseAndIdNot(String email, Long id);

    @Query("""
            select count(distinct user)
            from UserEntity user
            join user.roles role
            where user.isActive = true
              and upper(role.name) = 'ADMIN'
              and user.id <> :excludedUserId
            """)
    long countActiveAdminsExcluding(@Param("excludedUserId") Long excludedUserId);

    @Query("""
            select count(distinct user)
            from UserEntity user
            join user.roles role
            where upper(role.name) = 'ADMIN'
            """)
    long countAdmins();
}
