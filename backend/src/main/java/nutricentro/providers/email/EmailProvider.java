package nutricentro.providers.email;

public interface EmailProvider {
    String providerName();

    ProviderEmailResponse send(ProviderEmailRequest request);
}
