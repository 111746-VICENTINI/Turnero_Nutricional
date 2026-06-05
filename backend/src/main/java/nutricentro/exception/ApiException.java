package nutricentro.exception;

import lombok.Getter;

@Getter
public class ApiException extends RuntimeException {

    private final int status;

    public ApiException(String message, int statusCode) {
        super(message);
        this.status = statusCode;
    }

}