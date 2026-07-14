package nutricentro.services;

import nutricentro.dtos.anthropometry.AntropometryRequestDTO;
import nutricentro.dtos.anthropometry.AntropometryResponseDTO;
import nutricentro.dtos.consultations.ConsultationRequestDTO;
import nutricentro.dtos.consultations.ConsultationResponseDTO;
import nutricentro.dtos.historyClinical.ClinicalDataDTO;
import nutricentro.dtos.historyClinical.ClinicalFileDownloadDTO;
import nutricentro.dtos.historyClinical.ClinicalFileResponseDTO;
import nutricentro.dtos.historyClinical.FoodPlanRequestDTO;
import nutricentro.dtos.historyClinical.FoodPlanResponseDTO;
import nutricentro.dtos.historyClinical.MedicalHistoryRequestDTO;
import nutricentro.dtos.historyClinical.MedicalHistoryResponseDTO;
import nutricentro.dtos.historyClinical.MenuMaterialDTO;
import nutricentro.dtos.historyClinical.NutritionalDataDTO;
import nutricentro.dtos.laboratory.LaboratoryRequestDTO;
import nutricentro.dtos.laboratory.LaboratoryResponseDTO;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;

@Service
public interface MedicalHistoryService {
    MedicalHistoryResponseDTO createOrUpdate(MedicalHistoryRequestDTO dto);
    MedicalHistoryResponseDTO getByPatientId(Long patientId);
    ClinicalDataDTO updateClinicalData(Long historyId, ClinicalDataDTO dto);
    NutritionalDataDTO updateNutritionalData(Long historyId, NutritionalDataDTO dto);
    LaboratoryResponseDTO addLaboratory(Long historyId, LaboratoryRequestDTO dto);
    LaboratoryResponseDTO updateLaboratory(Long laboratoryId, LaboratoryRequestDTO dto);
    void deleteLaboratory(Long laboratoryId);
    AntropometryResponseDTO addAnthropometry(Long historyId, AntropometryRequestDTO dto);
    AntropometryResponseDTO updateAnthropometry(Long anthropometryId, AntropometryRequestDTO dto);
    void deleteAnthropometry(Long anthropometryId);
    ConsultationResponseDTO addConsultation(Long historyId, ConsultationRequestDTO dto);
    ConsultationResponseDTO updateConsultation(Long consultationId, ConsultationRequestDTO dto);
    void deleteConsultation(Long consultationId);
    FoodPlanResponseDTO createFoodPlan(Long historyId, FoodPlanRequestDTO dto);
    FoodPlanResponseDTO updateFoodPlan(Long foodPlanId, FoodPlanRequestDTO dto);
    void deleteFoodPlan(Long foodPlanId);
    FoodPlanResponseDTO updateMenuMaterial(Long foodPlanId, MenuMaterialDTO dto);
    List<ClinicalFileResponseDTO> listFiles(Long historyId);
    ClinicalFileResponseDTO uploadFile(Long historyId, MultipartFile file, String type, String comment, LocalDate date, String professional);
    ClinicalFileDownloadDTO downloadFile(Long fileId);
    void deleteFile(Long fileId);
}
