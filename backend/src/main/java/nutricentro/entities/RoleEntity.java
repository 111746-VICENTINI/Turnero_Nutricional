package nutricentro.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "roles")
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class RoleEntity extends BaseEntity {

    @Column(nullable = false, unique = true)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToMany(mappedBy = "roles", fetch = FetchType.LAZY)
    private Set<UserEntity> users = new HashSet<>();

    @Column(name = "hierarchy")
    private Integer hierarchy;

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (o == null || getClass() != o.getClass()) {
            return false;
        }
        RoleEntity roleEntity = (RoleEntity) o;
        return getId() != null && getId().equals(roleEntity.getId());
    }

}
