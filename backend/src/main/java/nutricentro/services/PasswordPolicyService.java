package nutricentro.services;

public interface PasswordPolicyService {
    void validate(String password, String confirmation);
}
