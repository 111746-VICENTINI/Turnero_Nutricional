package nutricentro.controllers;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import nutricentro.dtos.users.RegisterRequestDTO;
import nutricentro.dtos.users.UpdateUserDTO;
import nutricentro.dtos.users.UserResponseDTO;
import nutricentro.services.UserService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/user")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
@CrossOrigin(origins = "${app.cors.allowed-origins:*}")
public class UserController {

    private final UserService userService;

    @PostMapping("/create")
    public ResponseEntity<UserResponseDTO> create(@Valid @RequestBody RegisterRequestDTO request){
        return ResponseEntity.ok(userService.createUser(request));
    }

    @GetMapping("/all")
    public ResponseEntity<List<UserResponseDTO>> findAll(){
        return ResponseEntity.ok(userService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserResponseDTO> findById(@PathVariable Long id){
        return ResponseEntity.ok(userService.findById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserResponseDTO> update(@PathVariable Long id,
                                                  @Valid @RequestBody UpdateUserDTO request) {
        return ResponseEntity.ok(userService.update(id, request));
    }

    @PostMapping("/{id}/resend-invitation")
    public ResponseEntity<UserResponseDTO> resendInvitation(@PathVariable Long id) {
        return ResponseEntity.ok(userService.resendInvitation(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        userService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<UserResponseDTO>> searchUsers(
            @RequestParam(required = false)
            String search,

            @RequestParam(required = false)
            String role,

            @RequestParam(required = false)
            Boolean isActive,

            @RequestParam(defaultValue = "0")
            int page,

            @RequestParam(defaultValue = "10")
            int size,

            @RequestParam(defaultValue = "username")
            String sortBy,

            @RequestParam(defaultValue = "asc")
            String direction
    ) {

        PageRequest pageRequest = PageRequest.of(
                page,
                size,
                Sort.by(
                        Sort.Direction.fromString(direction),
                        sortBy
                )
        );

        return ResponseEntity.ok(
                userService.searchUsers(
                        search,
                        role,
                        isActive,
                        pageRequest
                )
        );
    }
}
