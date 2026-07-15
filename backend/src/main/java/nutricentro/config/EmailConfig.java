package nutricentro.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

import java.time.Duration;

@Configuration
public class EmailConfig {

    @Bean
    public RestClient gmailApiRestClient(EmailProperties emailProperties) {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofSeconds(5));
        requestFactory.setReadTimeout(Duration.ofSeconds(15));

        String baseUrl = emailProperties.gmail() != null && emailProperties.gmail().apiBaseUrl() != null
                ? emailProperties.gmail().apiBaseUrl()
                : "https://gmail.googleapis.com";

        return RestClient.builder()
                .baseUrl(baseUrl)
                .requestFactory(requestFactory)
                .build();
    }

    @Bean
    public RestClient googleOAuthRestClient(EmailProperties emailProperties) {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofSeconds(5));
        requestFactory.setReadTimeout(Duration.ofSeconds(15));

        String tokenUrl = emailProperties.gmail() != null && emailProperties.gmail().tokenUrl() != null
                ? emailProperties.gmail().tokenUrl()
                : "https://oauth2.googleapis.com";

        return RestClient.builder()
                .baseUrl(tokenUrl)
                .requestFactory(requestFactory)
                .build();
    }
}
