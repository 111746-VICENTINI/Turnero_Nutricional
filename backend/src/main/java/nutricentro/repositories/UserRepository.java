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

    @Query("""
            select distinct user
            from UserEntity user
            join user.roles role
            where user.isActive = true
              and upper(role.name) = 'PROFESSIONAL'
              and not exists (
                  select forbiddenRole.id
                  from UserEntity forbiddenUser
                  join forbiddenUser.roles forbiddenRole
                  where forbiddenUser.id = user.id
                    and upper(forbiddenRole.name) in ('ADMIN', 'SECRETARY')
              )
              and not exists (
                  select professional.id
                  from ProfessionalEntity professional
                  where professional.user.id = user.id
              )
            order by user.username asc
            """)
    java.util.List<UserEntity> findActiveUnlinkedProfessionalUsers();

    @Query("""
            select distinct user
            from UserEntity user
            join user.roles role
            where user.isActive = true
              and upper(role.name) = 'PROFESSIONAL'
              and not exists (
                  select forbiddenRole.id
                  from UserEntity forbiddenUser
                  join forbiddenUser.roles forbiddenRole
                  where forbiddenUser.id = user.id
                    and upper(forbiddenRole.name) in ('ADMIN', 'SECRETARY')
              )
              and (
                  not exists (
                      select professional.id
                      from ProfessionalEntity professional
                      where professional.user.id = user.id
                  )
                  or exists (
                      select professional.id
                      from ProfessionalEntity professional
                      where professional.user.id = user.id
                        and professional.id = :professionalId
                  )
              )
            order by user.username asc
            """)
    java.util.List<UserEntity> findActiveAvailableProfessionalUsers(@Param("professionalId") Long professionalId);
}
