package nutricentro.services;

import nutricentro.entities.ProfessionalEntity;

import java.util.Optional;

public interface CurrentProfessionalProvider {

    boolean isProfessional();

    Optional<ProfessionalEntity> findCurrentProfessional();

    ProfessionalEntity requireCurrentProfessional();

    default Optional<Long> findCurrentProfessionalId() {
        return findCurrentProfessional().map(ProfessionalEntity::getId);
    }

    default Long requireCurrentProfessionalId() {
        return requireCurrentProfessional().getId();
    }
}
