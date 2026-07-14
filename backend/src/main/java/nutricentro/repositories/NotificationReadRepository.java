package nutricentro.repositories;

import nutricentro.entities.NotificationReadEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface NotificationReadRepository extends JpaRepository<NotificationReadEntity, Long> {
    List<NotificationReadEntity> findByRecipientUserIdAndNotificationKeyIn(
            Long recipientUserId,
            Collection<String> notificationKeys
    );

    Optional<NotificationReadEntity> findByRecipientUserIdAndNotificationKey(
            Long recipientUserId,
            String notificationKey
    );
}
