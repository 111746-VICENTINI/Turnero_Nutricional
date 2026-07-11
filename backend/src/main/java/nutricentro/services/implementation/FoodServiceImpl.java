package nutricentro.services.implementation;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import nutricentro.dtos.food.FoodRequestDTO;
import nutricentro.dtos.food.FoodResponseDTO;
import nutricentro.entities.FoodEntity;
import nutricentro.repositories.FoodRepository;
import nutricentro.services.FoodService;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class FoodServiceImpl implements FoodService {
    private static final String OPEN_FOOD_FACTS_SOURCE = "OPEN_FOOD_FACTS";
    private static final String LOCAL_SOURCE = "LOCAL";
    private static final int SEARCH_LIMIT = 10;

    private final FoodRepository foodRepository;
    private final RestClient restClient = RestClient.builder()
            .defaultHeader(HttpHeaders.USER_AGENT, "Nutricentro/1.0 (nutricentro@example.com)")
            .build();

    @Override
    public List<FoodResponseDTO> searchFoods(String query) {
        if (query == null || query.isBlank()) {
            return List.of();
        }

        List<FoodResponseDTO> remoteFoods = searchOpenFoodFacts(query.trim());
        if (!remoteFoods.isEmpty()) {
            return remoteFoods;
        }

        return foodRepository.findTop10ByNameContainingIgnoreCase(query.trim())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public FoodResponseDTO createFood(FoodRequestDTO dto) {
        FoodEntity food = new FoodEntity();
        food.setExternalId(dto.getExternalId());
        food.setName(dto.getName());
        food.setCalories(dto.getCalories());
        food.setProtein(dto.getProtein());
        food.setCarbohydrates(dto.getCarbohydrates());
        food.setFat(dto.getFat());
        food.setHealthyFat(dto.getHealthyFat());
        food.setSource(dto.getSource() == null || dto.getSource().isBlank() ? LOCAL_SOURCE : dto.getSource());
        return toResponse(foodRepository.save(food));
    }

    @Override
    public FoodResponseDTO getFoodById(Long id) {
        FoodEntity food = foodRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Alimento no encontrado"));
        return toResponse(food);
    }

    private List<FoodResponseDTO> searchOpenFoodFacts(String query) {
        try {
            URI uri = UriComponentsBuilder
                    .fromUriString("https://world.openfoodfacts.org/cgi/search.pl")
                    .queryParam("search_terms", query)
                    .queryParam("search_simple", 1)
                    .queryParam("action", "process")
                    .queryParam("json", 1)
                    .queryParam("page_size", SEARCH_LIMIT)
                    .queryParam("countries_tags", "argentina")
                    .queryParam("fields", "code,product_name,brands,image_front_small_url,nutriments")
                    .build()
                    .encode()
                    .toUri();

            JsonNode response = restClient.get().uri(uri).retrieve().body(JsonNode.class);
            if (response == null || !response.has("products")) {
                return List.of();
            }

            List<FoodResponseDTO> foods = new ArrayList<>();
            for (JsonNode product : response.get("products")) {
                FoodResponseDTO food = mapOpenFoodFactsProduct(product);
                if (food.getName() != null && !food.getName().isBlank()) {
                    foods.add(food);
                }
            }
            return foods;
        } catch (RestClientException ex) {
            return List.of();
        }
    }

    private FoodResponseDTO mapOpenFoodFactsProduct(JsonNode product) {
        JsonNode nutriments = product.path("nutriments");
        return FoodResponseDTO.builder()
                .externalId(text(product, "code"))
                .name(text(product, "product_name"))
                .brand(text(product, "brands"))
                .calories(number(nutriments, "energy-kcal_100g"))
                .protein(number(nutriments, "proteins_100g"))
                .carbohydrates(number(nutriments, "carbohydrates_100g"))
                .fat(number(nutriments, "fat_100g"))
                .healthyFat(number(nutriments, "monounsaturated-fat_100g"))
                .imageUrl(text(product, "image_front_small_url"))
                .source(OPEN_FOOD_FACTS_SOURCE)
                .build();
    }

    private FoodResponseDTO toResponse(FoodEntity food) {
        return FoodResponseDTO.builder()
                .id(food.getId())
                .externalId(food.getExternalId())
                .name(food.getName())
                .calories(food.getCalories())
                .protein(food.getProtein())
                .carbohydrates(food.getCarbohydrates())
                .fat(food.getFat())
                .healthyFat(food.getHealthyFat())
                .source(Objects.requireNonNullElse(food.getSource(), LOCAL_SOURCE))
                .build();
    }

    private String text(JsonNode node, String field) {
        JsonNode value = node.path(field);
        return value.isMissingNode() || value.isNull() ? null : value.asText();
    }

    private Double number(JsonNode node, String field) {
        JsonNode value = node.path(field);
        return value.isNumber() ? value.asDouble() : null;
    }
}
