package nutricentro.services;

import nutricentro.dtos.food.FoodRequestDTO;
import nutricentro.dtos.food.FoodResponseDTO;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public interface FoodService {
    List<FoodResponseDTO> searchFoods(String query);
    FoodResponseDTO createFood(FoodRequestDTO dto);
    FoodResponseDTO getFoodById(Long id);
}
