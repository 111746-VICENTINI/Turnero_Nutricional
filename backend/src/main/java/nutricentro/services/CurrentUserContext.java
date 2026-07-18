package nutricentro.services;

public record CurrentUserContext(Long userId, String username, String role) {

    public static CurrentUserContext system() {
        return new CurrentUserContext(null, "SYSTEM", "SYSTEM");
    }
}
