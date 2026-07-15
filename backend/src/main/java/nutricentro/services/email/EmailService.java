package nutricentro.services.email;

import nutricentro.dtos.email.EmailRequestDTO;
import nutricentro.dtos.email.EmailResponseDTO;

public interface EmailService {
    EmailResponseDTO send(EmailRequestDTO request);
}
