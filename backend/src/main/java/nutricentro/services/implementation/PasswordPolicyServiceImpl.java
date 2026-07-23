package nutricentro.services.implementation;

import nutricentro.services.PasswordPolicyService;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class PasswordPolicyServiceImpl implements PasswordPolicyService {

    private static final int MIN_LENGTH = 8;
    private static final int MAX_LENGTH = 100;

    @Override
    public void validate(String password, String confirmation) {
        if (!StringUtils.hasText(password)) {
            throw new IllegalArgumentException("La contraseña es obligatoria");
        }
        if (!password.equals(confirmation)) {
            throw new IllegalArgumentException("Las contraseñas no coinciden");
        }
        if (password.length() < MIN_LENGTH) {
            throw new IllegalArgumentException("La contraseña debe tener al menos 8 caracteres");
        }
        if (password.length() > MAX_LENGTH) {
            throw new IllegalArgumentException("La contraseña no puede superar los 100 caracteres");
        }
        if (!password.chars().anyMatch(Character::isUpperCase)) {
            throw new IllegalArgumentException("La contraseña debe incluir al menos una mayúscula");
        }
        if (!password.chars().anyMatch(Character::isLowerCase)) {
            throw new IllegalArgumentException("La contraseña debe incluir al menos una minúscula");
        }
        if (!password.chars().anyMatch(Character::isDigit)) {
            throw new IllegalArgumentException("La contraseña debe incluir al menos un número");
        }
    }
}
