package nutricentro.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.swagger.v3.core.jackson.ModelResolver;
import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration class for SpringDoc OpenAPI integration.
 * Provides beans for OpenAPI and ModelResolver setup.
 */
@Configuration
public class SpringDocConfig {
    @Value("${app.url}") private String url;
    @Value("${app.dev-name}") private String devName;
    @Value("${app.dev-email}") private String devEmail;

    /**
     * Creates the OpenAPI bean for API documentation.
     *
     * @param appName        The name of the application
     * @param appDescription The description of the application
     * @param appVersion     The version of the application
     * @return The OpenAPI configuration object
     */
    @Bean
    public OpenAPI openApi(@Value("${app.name}") String appName,
                           @Value("${app.desc}") String appDescription,
                           @Value("${app.version}") String appVersion) {
        Info info = new Info()
                .title(appName)
                .version(appVersion)
                .description(appDescription)
                .contact(
                        new Contact()
                                .name(devName)
                                .email(devEmail));

        Server server = new Server()
                .url(url)
                .description(appDescription);

        SecurityScheme jwtSecurityScheme = new SecurityScheme()
                .type(SecurityScheme.Type.HTTP)
                .scheme("bearer")
                .bearerFormat("JWT")
                .name("JWT Authentication")
                .description("Ingrese el token JWT obtenido del login");

        SecurityRequirement securityRequirement = new SecurityRequirement()
                .addList("Bearer Authentication");

        Components components = new Components()
                .addSecuritySchemes("Bearer Authentication", jwtSecurityScheme);

        return new OpenAPI()
                .components(new Components())
                .info(info)
                .addServersItem(server)
                .addSecurityItem(securityRequirement);
    }

    /**
     * Creates the ModelResolver bean for OpenAPI model resolution.
     *
     * @param objectMapper The Jackson ObjectMapper
     * @return The ModelResolver instance
     */
    @Bean
    public ModelResolver modelResolver(ObjectMapper objectMapper) {
        return new ModelResolver(objectMapper);
    }
}
