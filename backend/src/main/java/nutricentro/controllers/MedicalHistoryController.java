package nutricentro.controllers;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import nutricentro.dtos.anthropometry.AntropometryRequestDTO;
import nutricentro.dtos.anthropometry.AntropometryResponseDTO;
import nutricentro.dtos.consultations.ConsultationRequestDTO;
import nutricentro.dtos.consultations.ConsultationResponseDTO;
import nutricentro.dtos.historyClinical.ClinicalFileDownloadDTO;
import nutricentro.dtos.historyClinical.ClinicalFileResponseDTO;
import nutricentro.dtos.historyClinical.ClinicalDataDTO;
import nutricentro.dtos.historyClinical.FoodPlanRequestDTO;
import nutricentro.dtos.historyClinical.FoodPlanResponseDTO;
import nutricentro.dtos.historyClinical.MedicalHistoryRequestDTO;
import nutricentro.dtos.historyClinical.MedicalHistoryResponseDTO;
import nutricentro.dtos.historyClinical.MenuMaterialDTO;
import nutricentro.dtos.historyClinical.NutritionalDataDTO;
import nutricentro.dtos.laboratory.LaboratoryRequestDTO;
import nutricentro.dtos.laboratory.LaboratoryResponseDTO;
import nutricentro.services.MedicalHistoryService;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/medical-history")
@RequiredArgsConstructor
@CrossOrigin(origins = "${app.cors.allowed-origins:*}")
@PreAuthorize("hasAnyRole('ADMIN', 'PROFESSIONAL')")
public class MedicalHistoryController {
    private final MedicalHistoryService medicalHistoryService;

    @PostMapping
    public ResponseEntity<MedicalHistoryResponseDTO> createOrUpdate(
            @Valid @RequestBody MedicalHistoryRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(medicalHistoryService.createOrUpdate(dto));
    }

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<MedicalHistoryResponseDTO> getByPatientId(@PathVariable Long patientId) {
        return ResponseEntity.ok(medicalHistoryService.getByPatientId(patientId));
    }

    @PutMapping("/{historyId}/clinical-data")
    public ResponseEntity<ClinicalDataDTO> updateClinicalData(
            @PathVariable Long historyId,
            @Valid @RequestBody ClinicalDataDTO dto) {
        return ResponseEntity.ok(medicalHistoryService.updateClinicalData(historyId, dto));
    }

    @PutMapping("/{historyId}/nutritional-data")
    public ResponseEntity<NutritionalDataDTO> updateNutritionalData(
            @PathVariable Long historyId,
            @Valid @RequestBody NutritionalDataDTO dto) {
        return ResponseEntity.ok(medicalHistoryService.updateNutritionalData(historyId, dto));
    }

    @PostMapping("/{historyId}/laboratory")
    public ResponseEntity<LaboratoryResponseDTO> addLaboratory(
            @PathVariable Long historyId,
            @Valid @RequestBody LaboratoryRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(medicalHistoryService.addLaboratory(historyId, dto));
    }

    @PutMapping("/laboratory/{laboratoryId}")
    public ResponseEntity<LaboratoryResponseDTO> updateLaboratory(
            @PathVariable Long laboratoryId,
            @Valid @RequestBody LaboratoryRequestDTO dto) {
        return ResponseEntity.ok(medicalHistoryService.updateLaboratory(laboratoryId, dto));
    }

    @DeleteMapping("/laboratory/{laboratoryId}")
    public ResponseEntity<Void> deleteLaboratory(@PathVariable Long laboratoryId) {
        medicalHistoryService.deleteLaboratory(laboratoryId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{historyId}/anthropometry")
    public ResponseEntity<AntropometryResponseDTO> addAnthropometry(
            @PathVariable Long historyId,
            @Valid @RequestBody AntropometryRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(medicalHistoryService.addAnthropometry(historyId, dto));
    }

    @PutMapping("/anthropometry/{anthropometryId}")
    public ResponseEntity<AntropometryResponseDTO> updateAnthropometry(
            @PathVariable Long anthropometryId,
            @Valid @RequestBody AntropometryRequestDTO dto) {
        return ResponseEntity.ok(medicalHistoryService.updateAnthropometry(anthropometryId, dto));
    }

    @DeleteMapping("/anthropometry/{anthropometryId}")
    public ResponseEntity<Void> deleteAnthropometry(@PathVariable Long anthropometryId) {
        medicalHistoryService.deleteAnthropometry(anthropometryId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{historyId}/consultations")
    public ResponseEntity<ConsultationResponseDTO> addConsultation(
            @PathVariable Long historyId,
            @Valid @RequestBody ConsultationRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(medicalHistoryService.addConsultation(historyId, dto));
    }

    @PutMapping("/consultations/{consultationId}")
    public ResponseEntity<ConsultationResponseDTO> updateConsultation(
            @PathVariable Long consultationId,
            @Valid @RequestBody ConsultationRequestDTO dto) {
        return ResponseEntity.ok(medicalHistoryService.updateConsultation(consultationId, dto));
    }

    @DeleteMapping("/consultations/{consultationId}")
    public ResponseEntity<Void> deleteConsultation(@PathVariable Long consultationId) {
        medicalHistoryService.deleteConsultation(consultationId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{historyId}/food-plans")
    public ResponseEntity<FoodPlanResponseDTO> createFoodPlan(
            @PathVariable Long historyId,
            @Valid @RequestBody FoodPlanRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(medicalHistoryService.createFoodPlan(historyId, dto));
    }

    @PutMapping("/food-plans/{foodPlanId}")
    public ResponseEntity<FoodPlanResponseDTO> updateFoodPlan(
            @PathVariable Long foodPlanId,
            @Valid @RequestBody FoodPlanRequestDTO dto) {
        return ResponseEntity.ok(medicalHistoryService.updateFoodPlan(foodPlanId, dto));
    }

    @DeleteMapping("/food-plans/{foodPlanId}")
    public ResponseEntity<Void> deleteFoodPlan(@PathVariable Long foodPlanId) {
        medicalHistoryService.deleteFoodPlan(foodPlanId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/food-plans/{foodPlanId}/menu-material")
    public ResponseEntity<FoodPlanResponseDTO> updateMenuMaterial(
            @PathVariable Long foodPlanId,
            @Valid @RequestBody MenuMaterialDTO dto) {
        return ResponseEntity.ok(medicalHistoryService.updateMenuMaterial(foodPlanId, dto));
    }

    @GetMapping("/{historyId}/files")
    public ResponseEntity<List<ClinicalFileResponseDTO>> listFiles(@PathVariable Long historyId) {
        return ResponseEntity.ok(medicalHistoryService.listFiles(historyId));
    }

    @PostMapping(value = "/{historyId}/files", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ClinicalFileResponseDTO> uploadFile(
            @PathVariable Long historyId,
            @RequestParam MultipartFile file,
            @RequestParam String type,
            @RequestParam(required = false) String comment,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) String professional) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(medicalHistoryService.uploadFile(historyId, file, type, comment, date, professional));
    }

    @GetMapping("/files/{fileId}/download")
    public ResponseEntity<byte[]> downloadFile(@PathVariable Long fileId) {
        ClinicalFileDownloadDTO file = medicalHistoryService.downloadFile(fileId);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(file.getContentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + file.getOriginalName() + "\"")
                .body(file.getContent());
    }

    @GetMapping("/files/{fileId}/preview")
    public ResponseEntity<byte[]> previewFile(@PathVariable Long fileId) {
        ClinicalFileDownloadDTO file = medicalHistoryService.downloadFile(fileId);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(file.getContentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + file.getOriginalName() + "\"")
                .body(file.getContent());
    }

    @DeleteMapping("/files/{fileId}")
    public ResponseEntity<Void> deleteFile(@PathVariable Long fileId) {
        medicalHistoryService.deleteFile(fileId);
        return ResponseEntity.noContent().build();
    }
}
