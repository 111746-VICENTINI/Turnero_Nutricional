package nutricentro.providers.email;

public record ProviderEmailAttachment(
        String filename,
        String contentType,
        String contentBase64,
        long sizeBytes
) {
}
