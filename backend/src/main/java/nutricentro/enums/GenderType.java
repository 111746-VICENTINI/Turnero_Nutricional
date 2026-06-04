package nutricentro.enums;

public enum GenderType {
    FEMALE, MALE, NON_BINARY, PREFER_NOT_TO_SAY;

    public String toUpperCase() {
        return name().toLowerCase();
    }
}
