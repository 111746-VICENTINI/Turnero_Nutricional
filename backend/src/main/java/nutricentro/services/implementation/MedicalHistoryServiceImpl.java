package nutricentro.services.implementation;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import nutricentro.dtos.anthropometry.AntropometryRequestDTO;
import nutricentro.dtos.anthropometry.AntropometryResponseDTO;
import nutricentro.dtos.appointments.AppointmentUpdateDTO;
import nutricentro.dtos.consultations.ConsultationRequestDTO;
import nutricentro.dtos.consultations.ConsultationResponseDTO;
import nutricentro.dtos.food.NutritionTotalsDTO;
import nutricentro.dtos.historyClinical.ClinicalDataDTO;
import nutricentro.dtos.historyClinical.ClinicalFileDownloadDTO;
import nutricentro.dtos.historyClinical.ClinicalFileResponseDTO;
import nutricentro.dtos.historyClinical.FoodPlanRequestDTO;
import nutricentro.dtos.historyClinical.FoodPlanResponseDTO;
import nutricentro.dtos.historyClinical.MedicalHistoryRequestDTO;
import nutricentro.dtos.historyClinical.MedicalHistoryResponseDTO;
import nutricentro.dtos.historyClinical.MenuMaterialDTO;
import nutricentro.dtos.historyClinical.NutritionalDataDTO;
import nutricentro.dtos.historyClinical.MedicationDTO;
import nutricentro.dtos.historyClinical.AllergyDTO;
import nutricentro.dtos.laboratory.LaboratoryRequestDTO;
import nutricentro.dtos.laboratory.LaboratoryResponseDTO;
import nutricentro.dtos.patients.PatientResponseDTO;
import nutricentro.entities.AntropometryEntity;
import nutricentro.entities.AllergyEntity;
import nutricentro.entities.AppointmentEntity;
import nutricentro.entities.ClinicalDataEntity;
import nutricentro.entities.ClinicalFileEntity;
import nutricentro.entities.ConsultationEntity;
import nutricentro.entities.FoodPlanEntity;
import nutricentro.entities.LaboratoryEntity;
import nutricentro.entities.MedicalHistoryEntity;
import nutricentro.entities.MedicationEntity;
import nutricentro.entities.NutritionalDataEntity;
import nutricentro.entities.PatientEntity;
import nutricentro.entities.ProfessionalEntity;
import nutricentro.enums.AppointmentStatus;
import nutricentro.enums.ConsultationStatus;
import nutricentro.enums.GenderType;
import nutricentro.exception.ApiException;
import nutricentro.repositories.AntropometryRepository;
import nutricentro.repositories.AppointmentRepository;
import nutricentro.repositories.ClinicalDataRepository;
import nutricentro.repositories.ClinicalFileRepository;
import nutricentro.repositories.ConsultationRepository;
import nutricentro.repositories.FoodPlanRepository;
import nutricentro.repositories.LaboratoryRepository;
import nutricentro.repositories.MedicalHistoryRepository;
import nutricentro.repositories.NutritionalDataRepository;
import nutricentro.repositories.PatientRepository;
import nutricentro.repositories.ProfessionalRepository;
import nutricentro.services.AppointmentService;
import nutricentro.services.MedicalHistoryService;
import nutricentro.services.NutritionalCalculatorService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.Period;
import java.time.ZoneId;
import java.util.Date;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MedicalHistoryServiceImpl implements MedicalHistoryService {
    private static final String MANUAL_SOURCE = "MANUAL";

    private final MedicalHistoryRepository medicalHistoryRepository;
    private final AppointmentRepository appointmentRepository;
    private final PatientRepository patientRepository;
    private final ProfessionalRepository professionalRepository;
    private final ClinicalDataRepository clinicalDataRepository;
    private final ClinicalFileRepository clinicalFileRepository;
    private final NutritionalDataRepository nutritionalDataRepository;
    private final LaboratoryRepository laboratoryRepository;
    private final AntropometryRepository antropometryRepository;
    private final ConsultationRepository consultationRepository;
    private final FoodPlanRepository foodPlanRepository;
    private final NutritionalCalculatorService nutritionalCalculatorService;
    private final AppointmentService appointmentService;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public MedicalHistoryResponseDTO createOrUpdate(MedicalHistoryRequestDTO dto) {
        PatientEntity patient = patientRepository.findById(dto.getPatientId())
                .orElseThrow(() -> new EntityNotFoundException("Paciente no encontrado"));

        MedicalHistoryEntity history = medicalHistoryRepository.findByPatientId(patient.getId())
                .orElseGet(MedicalHistoryEntity::new);

        history.setPatient(patient);
        history.setConsultationDate(dto.getConsultationDate() != null ? dto.getConsultationDate() : new Date());
        history.setConsultationReason(dto.getConsultationReason());
        history.setObservations(dto.getObservations());

        if (dto.getProfessionalId() != null) {
            history.setProfessional(findProfessional(dto.getProfessionalId()));
        }

        MedicalHistoryEntity saved = medicalHistoryRepository.save(history);
        return toHistoryResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public MedicalHistoryResponseDTO getByPatientId(Long patientId) {
        MedicalHistoryEntity history = medicalHistoryRepository.findByPatientId(patientId)
                .orElseThrow(() -> new EntityNotFoundException("Historia clinica no encontrada"));
        return toHistoryResponse(history);
    }

    @Override
    @Transactional
    public ClinicalDataDTO updateClinicalData(Long historyId, ClinicalDataDTO dto) {
        MedicalHistoryEntity history = findHistory(historyId);
        ClinicalDataEntity clinicalData = clinicalDataRepository.findByMedicalHistoryId(historyId)
                .orElseGet(ClinicalDataEntity::new);
        clinicalData.setMedicalHistory(history);
        clinicalData.setEmploymentSituation(dto.getEmploymentSituation());
        clinicalData.setOccupation(dto.getOccupation());
        clinicalData.setCompany(dto.getCompany());
        clinicalData.setWorkingHours(dto.getWorkingHours());
        clinicalData.setWorkShift(dto.getWorkShift());
        clinicalData.setSedentaryWork(dto.getSedentaryWork());
        clinicalData.setActiveWork(dto.getActiveWork());
        clinicalData.setNightWork(dto.getNightWork());
        clinicalData.setLivingSituation(dto.getLivingSituation());
        clinicalData.setHouseholdPeopleCount(dto.getHouseholdPeopleCount());
        clinicalData.setResponsibleForFood(dto.getResponsibleForFood());
        clinicalData.setCooksAtHome(dto.getCooksAtHome());
        clinicalData.setBuysFood(dto.getBuysFood());
        clinicalData.setOrganizesMeals(dto.getOrganizesMeals());
        clinicalData.setEatsOutsideHome(dto.getEatsOutsideHome());
        clinicalData.setPregnancies(dto.getPregnancies());
        clinicalData.setPregnancyCount(dto.getPregnancyCount());
        clinicalData.setLactation(dto.getLactation());
        clinicalData.setMenopause(dto.getMenopause());
        clinicalData.setMenstrualCycle(dto.getMenstrualCycle());
        clinicalData.setContraceptiveMethod(dto.getContraceptiveMethod());
        clinicalData.setSmoker(dto.getSmoker());
        clinicalData.setDailyCigarettes(dto.getDailyCigarettes());
        clinicalData.setSmokingStartDate(dto.getSmokingStartDate());
        clinicalData.setAlcohol(dto.getAlcohol());
        clinicalData.setAlcoholFrequency(dto.getAlcoholFrequency());
        clinicalData.setAlcoholicBeverageType(dto.getAlcoholicBeverageType());
        clinicalData.setCaffeine(dto.getCaffeine());
        clinicalData.setMate(dto.getMate());
        clinicalData.setEnergyDrinks(dto.getEnergyDrinks());
        clinicalData.setRecreationalDrugs(dto.getRecreationalDrugs());
        clinicalData.setSupplements(dto.getSupplements());
        clinicalData.setSupplementationDetails(dto.getSupplementationDetails());
        clinicalData.setSleepHoursPerNight(dto.getSleepHoursPerNight());
        clinicalData.setSleepQuality(dto.getSleepQuality());
        clinicalData.setWakesUpAtNight(dto.getWakesUpAtNight());
        clinicalData.setSnores(dto.getSnores());
        clinicalData.setDiagnosedApnea(dto.getDiagnosedApnea());
        clinicalData.setStressLevel(dto.getStressLevel());
        clinicalData.setAnxiety(dto.getAnxiety());
        clinicalData.setDepression(dto.getDepression());
        clinicalData.setEmotionalEating(dto.getEmotionalEating());
        clinicalData.setBingeEating(dto.getBingeEating());
        clinicalData.setSnacking(dto.getSnacking());
        clinicalData.setNightHunger(dto.getNightHunger());
        clinicalData.setHeartburn(dto.getHeartburn());
        clinicalData.setReflux(dto.getReflux());
        clinicalData.setConstipation(dto.getConstipation());
        clinicalData.setDiarrhea(dto.getDiarrhea());
        clinicalData.setAbdominalDistension(dto.getAbdominalDistension());
        clinicalData.setIrritableBowel(dto.getIrritableBowel());
        clinicalData.setAbdominalPain(dto.getAbdominalPain());
        clinicalData.setPathologies(toJson(dto.getPathologies()));
        clinicalData.setDiseases(dto.getDiseases());
        clinicalData.setAllergies(dto.getAllergies());
        clinicalData.setMedications(dto.getMedications());
        replaceMedicationRecords(clinicalData, dto.getMedicationRecords());
        replaceAllergyRecords(clinicalData, dto.getAllergyRecords());
        clinicalData.setFamilyHistory(dto.getFamilyHistory());
        clinicalData.setSurgeries(dto.getSurgeries());
        clinicalData.setObservations(dto.getObservations());
        return toClinicalDataResponse(clinicalDataRepository.save(clinicalData));
    }

    @Override
    @Transactional
    public NutritionalDataDTO updateNutritionalData(Long historyId, NutritionalDataDTO dto) {
        MedicalHistoryEntity history = findHistory(historyId);
        NutritionalDataEntity nutritionalData = nutritionalDataRepository.findByMedicalHistoryId(historyId)
                .orElseGet(NutritionalDataEntity::new);
        nutritionalData.setMedicalHistory(history);
        nutritionalData.setDietType(dto.getDietType());
        nutritionalData.setPreferences(dto.getPreferences());
        nutritionalData.setBreakfast(dto.getBreakfast());
        nutritionalData.setMidMorningSnack(dto.getMidMorningSnack());
        nutritionalData.setLunch(dto.getLunch());
        nutritionalData.setSnack(dto.getSnack());
        nutritionalData.setMidAfternoonSnack(dto.getMidAfternoonSnack());
        nutritionalData.setDinner(dto.getDinner());
        nutritionalData.setFavoriteFoods(dto.getFavoriteFoods());
        nutritionalData.setDislikedFoods(dto.getDislikedFoods());
        nutritionalData.setProhibitedFoods(dto.getProhibitedFoods());
        nutritionalData.setRestrictions(dto.getRestrictions());
        nutritionalData.setWaterIntake(dto.getWaterIntake());
        nutritionalData.setWaterLitersPerDay(dto.getWaterLitersPerDay());
        nutritionalData.setDrinksWater(dto.getDrinksWater());
        nutritionalData.setDrinksSoda(dto.getDrinksSoda());
        nutritionalData.setBreakfastTime(dto.getBreakfastTime());
        nutritionalData.setLunchTime(dto.getLunchTime());
        nutritionalData.setSnackTime(dto.getSnackTime());
        nutritionalData.setDinnerTime(dto.getDinnerTime());
        nutritionalData.setSnackCount(dto.getSnackCount());
        nutritionalData.setPhysicalActivity(dto.getPhysicalActivity());
        nutritionalData.setSport(dto.getSport());
        nutritionalData.setSportGoal(dto.getSportGoal());
        nutritionalData.setCompetition(dto.getCompetition());
        nutritionalData.setRecreational(dto.getRecreational());
        nutritionalData.setProfessionalSport(dto.getProfessionalSport());
        nutritionalData.setPosition(dto.getPosition());
        nutritionalData.setCategory(dto.getCategory());
        nutritionalData.setCoach(dto.getCoach());
        nutritionalData.setTrainingSessionsPerWeek(dto.getTrainingSessionsPerWeek());
        nutritionalData.setActivityFrequency(dto.getActivityFrequency());
        nutritionalData.setActivityIntensity(dto.getActivityIntensity());
        nutritionalData.setActivityDuration(dto.getActivityDuration());
        nutritionalData.setTrainingPlace(dto.getTrainingPlace());
        nutritionalData.setStrengthTraining(dto.getStrengthTraining());
        nutritionalData.setCardioTraining(dto.getCardioTraining());
        nutritionalData.setMobilityTraining(dto.getMobilityTraining());
        nutritionalData.setOtherTraining(dto.getOtherTraining());
        nutritionalData.setObservations(dto.getObservations());
        return toNutritionalDataResponse(nutritionalDataRepository.save(nutritionalData));
    }

    @Override
    @Transactional
    public LaboratoryResponseDTO addLaboratory(Long historyId, LaboratoryRequestDTO dto) {
        LaboratoryEntity laboratory = new LaboratoryEntity();
        laboratory.setMedicalHistory(findHistory(historyId));
        applyLaboratory(laboratory, dto);
        return toLaboratoryResponse(laboratoryRepository.save(laboratory));
    }

    @Override
    @Transactional
    public LaboratoryResponseDTO updateLaboratory(Long laboratoryId, LaboratoryRequestDTO dto) {
        LaboratoryEntity laboratory = laboratoryRepository.findById(laboratoryId)
                .orElseThrow(() -> new EntityNotFoundException("Laboratorio no encontrado"));
        applyLaboratory(laboratory, dto);
        return toLaboratoryResponse(laboratoryRepository.save(laboratory));
    }

    @Override
    @Transactional
    public void deleteLaboratory(Long laboratoryId) {
        if (!laboratoryRepository.existsById(laboratoryId)) {
            throw new EntityNotFoundException("Laboratorio no encontrado");
        }
        laboratoryRepository.deleteById(laboratoryId);
    }

    @Override
    @Transactional
    public AntropometryResponseDTO addAnthropometry(Long historyId, AntropometryRequestDTO dto) {
        MedicalHistoryEntity history = findHistory(historyId);
        AntropometryEntity antropometry = new AntropometryEntity();
        antropometry.setMedicalHistory(history);
        applyAnthropometry(antropometry, dto, history);
        AntropometryEntity saved = antropometryRepository.save(antropometry);
        syncLatestAnthropometry(history.getId());
        return toAntropometryResponse(saved);
    }

    @Override
    @Transactional
    public AntropometryResponseDTO updateAnthropometry(Long anthropometryId, AntropometryRequestDTO dto) {
        AntropometryEntity antropometry = antropometryRepository.findById(anthropometryId)
                .orElseThrow(() -> new EntityNotFoundException("Antropometria no encontrada"));
        MedicalHistoryEntity history = antropometry.getMedicalHistory();
        applyAnthropometry(antropometry, dto, history);
        AntropometryEntity saved = antropometryRepository.save(antropometry);
        syncLatestAnthropometry(history.getId());
        return toAntropometryResponse(saved);
    }

    @Override
    @Transactional
    public void deleteAnthropometry(Long anthropometryId) {
        AntropometryEntity antropometry = antropometryRepository.findById(anthropometryId)
                .orElseThrow(() -> new EntityNotFoundException("Antropometria no encontrada"));
        Long historyId = antropometry.getMedicalHistory().getId();
        antropometryRepository.delete(antropometry);
        syncLatestAnthropometry(historyId);
    }

    @Override
    @Transactional
    public ConsultationResponseDTO addConsultation(Long historyId, ConsultationRequestDTO dto) {
        MedicalHistoryEntity history = findHistory(historyId);
        ConsultationEntity consultation = new ConsultationEntity();
        consultation.setMedicalHistory(history);
        consultation.setPatient(history.getPatient());
        applyConsultation(consultation, dto, history);
        ConsultationEntity saved = consultationRepository.save(consultation);
        completeClinicalFlowIfFinalized(saved, null);
        return toConsultationResponse(saved);
    }

    @Override
    @Transactional
    public ConsultationResponseDTO updateConsultation(Long consultationId, ConsultationRequestDTO dto) {
        ConsultationEntity consultation = consultationRepository.findById(consultationId)
                .orElseThrow(() -> new EntityNotFoundException("Consulta no encontrada"));
        ConsultationStatus previousStatus = consultation.getStatus();
        validateFinalizedConsultationTransition(previousStatus, dto.getStatus());
        applyConsultation(consultation, dto, consultation.getMedicalHistory());
        ConsultationEntity saved = consultationRepository.save(consultation);
        completeClinicalFlowIfFinalized(saved, previousStatus);
        return toConsultationResponse(saved);
    }

    @Override
    @Transactional
    public void deleteConsultation(Long consultationId) {
        ConsultationEntity consultation = consultationRepository.findById(consultationId)
                .orElseThrow(() -> new EntityNotFoundException("Consulta no encontrada"));
        if (consultation.getStatus() == ConsultationStatus.FINALIZADA) {
            throw new ApiException("No se puede eliminar una consulta finalizada", HttpStatus.CONFLICT.value());
        }
        consultationRepository.delete(consultation);
    }

    @Override
    @Transactional
    public FoodPlanResponseDTO createFoodPlan(Long historyId, FoodPlanRequestDTO dto) {
        MedicalHistoryEntity history = findHistory(historyId);
        FoodPlanEntity foodPlan = new FoodPlanEntity();
        foodPlan.setMedicalHistory(history);
        foodPlan.setPatient(history.getPatient());
        applyFoodPlan(foodPlan, dto, true);
        return toFoodPlanResponse(foodPlanRepository.save(foodPlan));
    }

    @Override
    @Transactional
    public FoodPlanResponseDTO updateFoodPlan(Long foodPlanId, FoodPlanRequestDTO dto) {
        FoodPlanEntity foodPlan = foodPlanRepository.findById(foodPlanId)
                .orElseThrow(() -> new EntityNotFoundException("Plan alimentario no encontrado"));
        applyFoodPlan(foodPlan, dto, false);
        return toFoodPlanResponse(foodPlanRepository.save(foodPlan));
    }

    @Override
    @Transactional
    public void deleteFoodPlan(Long foodPlanId) {
        if (!foodPlanRepository.existsById(foodPlanId)) {
            throw new EntityNotFoundException("Plan alimentario no encontrado");
        }
        foodPlanRepository.deleteById(foodPlanId);
    }

    @Override
    @Transactional
    public FoodPlanResponseDTO updateMenuMaterial(Long foodPlanId, MenuMaterialDTO dto) {
        FoodPlanEntity foodPlan = foodPlanRepository.findById(foodPlanId)
                .orElseThrow(() -> new EntityNotFoundException("Plan alimentario no encontrado"));
        foodPlan.setMenuDelivered(Boolean.TRUE.equals(dto.getDelivered()));
        foodPlan.setMenuDeliveredDate(dto.getDeliveredDate() != null ? dto.getDeliveredDate() : new Date());
        foodPlan.setMenuMaterialName(dto.getMaterialName());
        foodPlan.setMenuMaterialUrl(dto.getMaterialUrl());
        return toFoodPlanResponse(foodPlanRepository.save(foodPlan));
    }

    @Override
    @Transactional(readOnly = true)
    public List<ClinicalFileResponseDTO> listFiles(Long historyId) {
        return clinicalFileRepository.findByMedicalHistoryIdOrderByFileDateDescIdDesc(historyId).stream()
                .map(this::toClinicalFileResponse)
                .toList();
    }

    @Override
    @Transactional
    public ClinicalFileResponseDTO uploadFile(
            Long historyId,
            MultipartFile file,
            String type,
            String comment,
            LocalDate date,
            String professional) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("El archivo es obligatorio");
        }

        ClinicalFileEntity entity = new ClinicalFileEntity();
        entity.setMedicalHistory(findHistory(historyId));
        entity.setOriginalName(file.getOriginalFilename() != null ? file.getOriginalFilename() : "archivo");
        entity.setContentType(file.getContentType() != null ? file.getContentType() : "application/octet-stream");
        entity.setSize(file.getSize());
        entity.setType(type == null || type.isBlank() ? "Estudio" : type);
        entity.setComment(comment);
        entity.setFileDate(date != null ? date : LocalDate.now());
        entity.setProfessional(professional);

        try {
            entity.setContent(file.getBytes());
        } catch (IOException ex) {
            throw new IllegalArgumentException("No se pudo leer el archivo");
        }

        return toClinicalFileResponse(clinicalFileRepository.save(entity));
    }

    @Override
    @Transactional(readOnly = true)
    public ClinicalFileDownloadDTO downloadFile(Long fileId) {
        ClinicalFileEntity file = clinicalFileRepository.findById(fileId)
                .orElseThrow(() -> new EntityNotFoundException("Archivo no encontrado"));

        return ClinicalFileDownloadDTO.builder()
                .originalName(file.getOriginalName())
                .contentType(file.getContentType())
                .content(file.getContent())
                .build();
    }

    @Override
    @Transactional
    public void deleteFile(Long fileId) {
        if (!clinicalFileRepository.existsById(fileId)) {
            throw new EntityNotFoundException("Archivo no encontrado");
        }
        clinicalFileRepository.deleteById(fileId);
    }

    private void applyLaboratory(LaboratoryEntity laboratory, LaboratoryRequestDTO dto) {
        laboratory.setDate(dto.getDate() != null ? dto.getDate() : new Date());
        laboratory.setGlucose(dto.getGlucose());
        laboratory.setCholesterol(dto.getCholesterol());
        laboratory.setHdl(dto.getHdl());
        laboratory.setLdl(dto.getLdl());
        laboratory.setTriglycerides(dto.getTriglycerides());
        laboratory.setVitaminD(dto.getVitaminD());
        laboratory.setVitaminB12(dto.getVitaminB12());
        laboratory.setIron(dto.getIron());
        laboratory.setFerritin(dto.getFerritin());
        laboratory.setInsulin(dto.getInsulin());
        laboratory.setHba1c(dto.getHba1c());
        laboratory.setPcr(dto.getPcr());
        laboratory.setAst(dto.getAst());
        laboratory.setAlt(dto.getAlt());
        laboratory.setTsgo(dto.getTsgo());
        laboratory.setTsgp(dto.getTsgp());
        laboratory.setSodium(dto.getSodium());
        laboratory.setPotassium(dto.getPotassium());
        laboratory.setCalcium(dto.getCalcium());
        laboratory.setMagnesium(dto.getMagnesium());
        laboratory.setPhosphorus(dto.getPhosphorus());
        laboratory.setProteins(dto.getProteins());
        laboratory.setAlbumin(dto.getAlbumin());
        laboratory.setCortisol(dto.getCortisol());
        laboratory.setTestosterone(dto.getTestosterone());
        laboratory.setEstradiol(dto.getEstradiol());
        laboratory.setFsh(dto.getFsh());
        laboratory.setLh(dto.getLh());
        laboratory.setT3(dto.getT3());
        laboratory.setTsh(dto.getTsh());
        laboratory.setT4(dto.getT4());
        laboratory.setHemoglobin(dto.getHemoglobin());
        laboratory.setCustomParameters(dto.getCustomParameters());
        laboratory.setObservations(dto.getObservations());
    }

    private void applyAnthropometry(AntropometryEntity antropometry, AntropometryRequestDTO dto, MedicalHistoryEntity history) {
        PatientEntity patient = history.getPatient();
        antropometry.setDate(dto.getDate() != null ? dto.getDate() : new Date());
        antropometry.setProfessionalName(dto.getProfessionalName());
        antropometry.setSource(resolveSource(dto.getSource(), dto.getSoftwareSource()));
        antropometry.setWeight(dto.getWeight());
        antropometry.setHeight(dto.getHeight());
        antropometry.setSittingHeight(dto.getSittingHeight());
        antropometry.setAnthropometricAge(dto.getAnthropometricAge());
        antropometry.setAnthropometricGoal(dto.getAnthropometricGoal());
        antropometry.setHeadCircumference(dto.getHeadCircumference());
        antropometry.setRelaxedArmCircumference(dto.getRelaxedArmCircumference());
        antropometry.setFlexedArmCircumference(dto.getFlexedArmCircumference());
        antropometry.setForearmCircumference(dto.getForearmCircumference());
        antropometry.setThoraxCircumference(dto.getThoraxCircumference());
        antropometry.setWaist(dto.getWaist());
        antropometry.setUmbilicalWaist(dto.getUmbilicalWaist());
        antropometry.setHips(dto.getHips());
        antropometry.setMaxThighCircumference(dto.getMaxThighCircumference());
        antropometry.setMedialThighCircumference(dto.getMedialThighCircumference());
        antropometry.setCalfCircumference(dto.getCalfCircumference());
        antropometry.setBiacromialDiameter(dto.getBiacromialDiameter());
        antropometry.setTransverseThoraxDiameter(dto.getTransverseThoraxDiameter());
        antropometry.setAnteroposteriorThoraxDiameter(dto.getAnteroposteriorThoraxDiameter());
        antropometry.setBiiliocristalDiameter(dto.getBiiliocristalDiameter());
        antropometry.setHumeralDiameter(dto.getHumeralDiameter());
        antropometry.setFemoralDiameter(dto.getFemoralDiameter());
        antropometry.setTricepsSkinfold(dto.getTricepsSkinfold());
        antropometry.setSubscapularSkinfold(dto.getSubscapularSkinfold());
        antropometry.setSupraspinaleSkinfold(dto.getSupraspinaleSkinfold());
        antropometry.setAbdominalSkinfold(dto.getAbdominalSkinfold());
        antropometry.setMedialThighSkinfold(dto.getMedialThighSkinfold());
        antropometry.setCalfSkinfold(dto.getCalfSkinfold());
        antropometry.setSkinfoldSum(dto.getSkinfoldSum());
        antropometry.setAdiposeMassPercentage(dto.getAdiposeMassPercentage());
        antropometry.setAdiposeMassKg(dto.getAdiposeMassKg());
        antropometry.setMuscleMassPercentage(dto.getMuscleMassPercentage());
        antropometry.setMuscleMassKg(dto.getMuscleMassKg());
        antropometry.setBoneMassPercentage(dto.getBoneMassPercentage());
        antropometry.setBoneMassKg(dto.getBoneMassKg());
        antropometry.setResidualMassPercentage(dto.getResidualMassPercentage());
        antropometry.setResidualMassKg(dto.getResidualMassKg());
        antropometry.setSkinMassPercentage(dto.getSkinMassPercentage());
        antropometry.setSkinMassKg(dto.getSkinMassKg());
        antropometry.setArm(dto.getArm());
        antropometry.setMuscleMass(dto.getMuscleMass());
        antropometry.setMuscleBoneIndex(dto.getMuscleBoneIndex());
        antropometry.setArmMuscleArea(dto.getArmMuscleArea());
        antropometry.setThighMuscleArea(dto.getThighMuscleArea());
        antropometry.setCalfMuscleArea(dto.getCalfMuscleArea());
        antropometry.setZScore(dto.getZScore());
        antropometry.setPeakHeightVelocityAge(dto.getPeakHeightVelocityAge());
        antropometry.setMaturation(dto.getMaturation());
        antropometry.setBsa(dto.getBsa());
        antropometry.setSoftwareSource(resolveSoftwareSource(dto.getSoftwareSource()));
        antropometry.setExternalReference(dto.getExternalReference());
        antropometry.setRawMeasurements(toJson(dto.getRawMeasurements()));
        antropometry.setObservations(dto.getObservations());
        antropometry.setBmi(calculateBmi(dto.getWeight(), dto.getHeight()));
        antropometry.setWaistHipRatio(calculateWaistHipRatio(dto.getWaist(), dto.getHips()));
        antropometry.setBmr(calculateBmr(dto.getWeight(), dto.getHeight(), patient));
        antropometry.setBodyFatPercentage(resolveBodyFat(dto, patient, antropometry.getBmi()));
    }

    private void syncLatestAnthropometry(Long historyId) {
        MedicalHistoryEntity history = findHistory(historyId);
        antropometryRepository.findByMedicalHistoryIdOrderByDateDesc(historyId).stream()
                .findFirst()
                .ifPresentOrElse(latest -> {
                    history.setWeight(latest.getWeight());
                    history.setHeight(latest.getHeight());
                }, () -> {
                    history.setWeight(null);
                    history.setHeight(null);
                });
        medicalHistoryRepository.save(history);
    }

    private void applyConsultation(ConsultationEntity consultation, ConsultationRequestDTO dto, MedicalHistoryEntity history) {
        AppointmentEntity appointment = resolveAppointment(dto.getAppointmentId(), consultation.getId(), history);
        if (appointment != null) {
            consultation.setAppointment(appointment);
            consultation.setPatient(appointment.getPatient());
            consultation.setProfessional(appointment.getProfessional());
        } else {
            validateConsultationPatient(dto.getPatientId(), history);
            consultation.setPatient(history.getPatient());
            consultation.setProfessional(resolveConsultationProfessional(dto.getProfessionalId(), consultation, history));
        }
        consultation.setDate(dto.getDate() != null ? dto.getDate() : new Date());
        consultation.setStartTime(dto.getStartTime() != null
                ? dto.getStartTime()
                : appointment != null ? appointment.getTime() : consultation.getStartTime());
        consultation.setEndTime(dto.getEndTime());
        consultation.setStatus(dto.getStatus() != null
                ? dto.getStatus()
                : consultation.getStatus() != null ? consultation.getStatus() : ConsultationStatus.BORRADOR);
        consultation.setReason(dto.getReason());
        consultation.setDiagnosis(dto.getDiagnosis());
        consultation.setTreatment(dto.getTreatment());
        consultation.setGoal(dto.getGoal());
        consultation.setEvolution(dto.getEvolution());
        consultation.setObservations(dto.getObservations());
        consultation.setIndications(dto.getIndications());
        consultation.setNextConsultation(dto.getNextConsultation());
        validateFinalizedConsultationConsistency(consultation);
    }

    private ProfessionalEntity resolveConsultationProfessional(Long professionalId, ConsultationEntity consultation, MedicalHistoryEntity history) {
        if (professionalId != null) {
            return findProfessional(professionalId);
        }
        if (consultation.getProfessional() != null) {
            return consultation.getProfessional();
        }
        return history.getProfessional();
    }

    private void validateFinalizedConsultationConsistency(ConsultationEntity consultation) {
        if (consultation.getStatus() != ConsultationStatus.FINALIZADA) {
            return;
        }
        if (consultation.getPatient() == null || consultation.getMedicalHistory() == null) {
            throw new ApiException("La consulta finalizada debe estar asociada a una historia clinica y paciente", HttpStatus.CONFLICT.value());
        }
        if (consultation.getProfessional() == null) {
            throw new ApiException("La consulta finalizada debe tener un profesional responsable", HttpStatus.CONFLICT.value());
        }
    }

    private AppointmentEntity resolveAppointment(Long appointmentId, Long consultationId, MedicalHistoryEntity history) {
        if (appointmentId == null) {
            return null;
        }
        if (consultationId == null && consultationRepository.existsByAppointmentId(appointmentId)) {
            throw new ApiException("El turno ya tiene una consulta asociada", HttpStatus.CONFLICT.value());
        }
        if (consultationId != null && consultationRepository.existsByAppointmentIdAndIdNot(appointmentId, consultationId)) {
            throw new ApiException("El turno ya tiene una consulta asociada", HttpStatus.CONFLICT.value());
        }

        AppointmentEntity appointment = appointmentRepository.findByIdForUpdate(appointmentId)
                .orElseThrow(() -> new EntityNotFoundException("Turno no encontrado"));
        validateAppointmentForConsultation(appointment, history);
        return appointment;
    }

    private void validateAppointmentForConsultation(AppointmentEntity appointment, MedicalHistoryEntity history) {
        Long historyPatientId = history.getPatient() != null ? history.getPatient().getId() : null;
        Long appointmentPatientId = appointment.getPatient() != null ? appointment.getPatient().getId() : null;
        if (historyPatientId == null || !historyPatientId.equals(appointmentPatientId)) {
            throw new ApiException("El turno no pertenece al paciente de la historia clinica", HttpStatus.CONFLICT.value());
        }
        if (appointment.getStatus() != AppointmentStatus.PATIENT_PRESENT
                && appointment.getStatus() != AppointmentStatus.COMPLETED) {
            throw new ApiException("Solo se puede iniciar una consulta desde un turno con paciente presente o completado", HttpStatus.CONFLICT.value());
        }
    }

    private void completeClinicalFlowIfFinalized(ConsultationEntity consultation, ConsultationStatus previousStatus) {
        if (consultation.getStatus() != ConsultationStatus.FINALIZADA) {
            return;
        }

        syncMedicalHistoryWithFinalizedConsultation(consultation);
        if (previousStatus == ConsultationStatus.FINALIZADA) {
            return;
        }

        AppointmentEntity appointment = consultation.getAppointment();
        if (appointment == null) {
            return;
        }
        if (appointment.getStatus() == AppointmentStatus.PATIENT_PRESENT) {
            appointmentService.updateAppointment(appointment.getId(), AppointmentUpdateDTO
                    .builder()
                    .status(AppointmentStatus.COMPLETED)
                    .build()
            );
            return;
        }
        if (appointment.getStatus() != AppointmentStatus.COMPLETED) {
            throw new ApiException("La consulta solo puede finalizar un turno con paciente presente", HttpStatus.CONFLICT.value());
        }
    }

    private void validateFinalizedConsultationTransition(ConsultationStatus previousStatus, ConsultationStatus requestedStatus) {
        if (previousStatus == ConsultationStatus.FINALIZADA && requestedStatus != null && requestedStatus != ConsultationStatus.FINALIZADA) {
            throw new ApiException("No se puede volver a borrador una consulta finalizada", HttpStatus.CONFLICT.value());
        }
    }

    private void syncMedicalHistoryWithFinalizedConsultation(ConsultationEntity consultation) {
        MedicalHistoryEntity history = consultation.getMedicalHistory();
        if (history == null) {
            return;
        }

        history.setConsultationDate(consultation.getDate() != null ? consultation.getDate() : new Date());
        history.setConsultationReason(consultation.getReason());
        history.setProfessional(consultation.getProfessional());
        if (consultation.getObservations() != null && !consultation.getObservations().isBlank()) {
            history.setObservations(consultation.getObservations());
        }
        medicalHistoryRepository.save(history);
    }

    private void validateConsultationPatient(Long patientId, MedicalHistoryEntity history) {
        if (patientId == null) {
            return;
        }
        Long historyPatientId = history.getPatient() != null ? history.getPatient().getId() : null;
        if (!patientId.equals(historyPatientId)) {
            throw new ApiException("La consulta debe pertenecer al paciente de la historia clinica", HttpStatus.CONFLICT.value());
        }
    }

    private void applyFoodPlan(FoodPlanEntity foodPlan, FoodPlanRequestDTO dto, boolean creating) {
        foodPlan.setTitle(dto.getTitle());
        foodPlan.setDescription(dto.getDescription());
        foodPlan.setStartDate(dto.getStartDate() != null ? dto.getStartDate() : new Date());
        foodPlan.setEndDate(dto.getEndDate());
        foodPlan.setActive(dto.getActive() == null || dto.getActive());
        foodPlan.setPdfUrl(dto.getPdfUrl());
        foodPlan.setPlanDelivered(Boolean.TRUE.equals(dto.getPlanDelivered()));
        foodPlan.setPlanDeliveredDate(dto.getPlanDeliveredDate());
        foodPlan.setPlanDeliveryMedium(dto.getPlanDeliveryMedium());
        foodPlan.setMenuDelivered(Boolean.TRUE.equals(dto.getMenuDelivered()));
        foodPlan.setMenuDeliveredDate(dto.getMenuDeliveredDate());
        foodPlan.setMenuMaterialName(dto.getMenuMaterialName());
        foodPlan.setMenuMaterialUrl(dto.getMenuMaterialUrl());
        foodPlan.setMenu(dto.getMenu());
        foodPlan.setNotes(dto.getNotes());
        foodPlan.setObservations(dto.getObservations());

        if (creating || dto.getItems() != null) {
            NutritionTotalsDTO totals = nutritionalCalculatorService.calculateTotals(dto.getItems());
            foodPlan.setTotalCalories(totals.getCalories());
            foodPlan.setTotalProtein(totals.getProtein());
            foodPlan.setTotalCarbohydrates(totals.getCarbohydrates());
            foodPlan.setTotalFat(totals.getFat());
        }
    }

    private MedicalHistoryEntity findHistory(Long historyId) {
        return medicalHistoryRepository.findById(historyId).orElseThrow(() -> new EntityNotFoundException("Historia clinica no encontrada"));
    }

    private ProfessionalEntity findProfessional(Long professionalId) {
        return professionalRepository.findById(professionalId).orElseThrow(() -> new EntityNotFoundException("Profesional no encontrado"));
    }

    private MedicalHistoryResponseDTO toHistoryResponse(MedicalHistoryEntity history) {
        return MedicalHistoryResponseDTO.builder()
                .id(history.getId())
                .consultationDate(history.getConsultationDate())
                .consultationReason(history.getConsultationReason())
                .observations(history.getObservations())
                .patientId(history.getPatient() != null ? history.getPatient().getId() : null)
                .patient(toPatientResponse(history.getPatient()))
                .professionalId(history.getProfessional() != null ? history.getProfessional().getId() : null)
                .clinicalData(history.getClinicalData() != null ? toClinicalDataResponse(history.getClinicalData()) : null)
                .nutritionalData(history.getNutritionalData() != null ? toNutritionalDataResponse(history.getNutritionalData()) : null)
                .laboratories(laboratoryRepository.findByMedicalHistoryIdOrderByDateDesc(history.getId()).stream()
                        .map(this::toLaboratoryResponse)
                        .toList())
                .anthropometries(antropometryRepository.findByMedicalHistoryIdOrderByDateDesc(history.getId()).stream()
                        .map(this::toAntropometryResponse)
                        .toList())
                .consultations(consultationRepository.findByMedicalHistoryIdOrderByDateDesc(history.getId()).stream()
                        .map(this::toConsultationResponse)
                        .toList())
                .foodPlans(foodPlanRepository.findByMedicalHistoryIdOrderByStartDateDesc(history.getId()).stream()
                        .map(this::toFoodPlanResponse)
                        .toList())
                .files(listFiles(history.getId()))
                .build();
    }

    private ClinicalDataDTO toClinicalDataResponse(ClinicalDataEntity clinicalData) {
        return ClinicalDataDTO.builder()
                .id(clinicalData.getId())
                .employmentSituation(clinicalData.getEmploymentSituation())
                .occupation(clinicalData.getOccupation())
                .company(clinicalData.getCompany())
                .workingHours(clinicalData.getWorkingHours())
                .workShift(clinicalData.getWorkShift())
                .sedentaryWork(clinicalData.getSedentaryWork())
                .activeWork(clinicalData.getActiveWork())
                .nightWork(clinicalData.getNightWork())
                .livingSituation(clinicalData.getLivingSituation())
                .householdPeopleCount(clinicalData.getHouseholdPeopleCount())
                .responsibleForFood(clinicalData.getResponsibleForFood())
                .cooksAtHome(clinicalData.getCooksAtHome())
                .buysFood(clinicalData.getBuysFood())
                .organizesMeals(clinicalData.getOrganizesMeals())
                .eatsOutsideHome(clinicalData.getEatsOutsideHome())
                .pregnancies(clinicalData.getPregnancies())
                .pregnancyCount(clinicalData.getPregnancyCount())
                .lactation(clinicalData.getLactation())
                .menopause(clinicalData.getMenopause())
                .menstrualCycle(clinicalData.getMenstrualCycle())
                .contraceptiveMethod(clinicalData.getContraceptiveMethod())
                .smoker(clinicalData.getSmoker())
                .dailyCigarettes(clinicalData.getDailyCigarettes())
                .smokingStartDate(clinicalData.getSmokingStartDate())
                .alcohol(clinicalData.getAlcohol())
                .alcoholFrequency(clinicalData.getAlcoholFrequency())
                .alcoholicBeverageType(clinicalData.getAlcoholicBeverageType())
                .caffeine(clinicalData.getCaffeine())
                .mate(clinicalData.getMate())
                .energyDrinks(clinicalData.getEnergyDrinks())
                .recreationalDrugs(clinicalData.getRecreationalDrugs())
                .supplements(clinicalData.getSupplements())
                .supplementationDetails(clinicalData.getSupplementationDetails())
                .sleepHoursPerNight(clinicalData.getSleepHoursPerNight())
                .sleepQuality(clinicalData.getSleepQuality())
                .wakesUpAtNight(clinicalData.getWakesUpAtNight())
                .snores(clinicalData.getSnores())
                .diagnosedApnea(clinicalData.getDiagnosedApnea())
                .stressLevel(clinicalData.getStressLevel())
                .anxiety(clinicalData.getAnxiety())
                .depression(clinicalData.getDepression())
                .emotionalEating(clinicalData.getEmotionalEating())
                .bingeEating(clinicalData.getBingeEating())
                .snacking(clinicalData.getSnacking())
                .nightHunger(clinicalData.getNightHunger())
                .heartburn(clinicalData.getHeartburn())
                .reflux(clinicalData.getReflux())
                .constipation(clinicalData.getConstipation())
                .diarrhea(clinicalData.getDiarrhea())
                .abdominalDistension(clinicalData.getAbdominalDistension())
                .irritableBowel(clinicalData.getIrritableBowel())
                .abdominalPain(clinicalData.getAbdominalPain())
                .pathologies(fromJsonList(clinicalData.getPathologies()))
                .diseases(clinicalData.getDiseases())
                .allergies(clinicalData.getAllergies())
                .medications(clinicalData.getMedications())
                .medicationRecords(clinicalData.getMedicationRecords().stream()
                        .map(this::toMedicationResponse)
                        .toList())
                .allergyRecords(clinicalData.getAllergyRecords().stream()
                        .map(this::toAllergyResponse)
                        .toList())
                .familyHistory(clinicalData.getFamilyHistory())
                .surgeries(clinicalData.getSurgeries())
                .observations(clinicalData.getObservations())
                .build();
    }

    private NutritionalDataDTO toNutritionalDataResponse(NutritionalDataEntity nutritionalData) {
        return NutritionalDataDTO.builder()
                .id(nutritionalData.getId())
                .dietType(nutritionalData.getDietType())
                .preferences(nutritionalData.getPreferences())
                .breakfast(nutritionalData.getBreakfast())
                .midMorningSnack(nutritionalData.getMidMorningSnack())
                .lunch(nutritionalData.getLunch())
                .snack(nutritionalData.getSnack())
                .midAfternoonSnack(nutritionalData.getMidAfternoonSnack())
                .dinner(nutritionalData.getDinner())
                .favoriteFoods(nutritionalData.getFavoriteFoods())
                .dislikedFoods(nutritionalData.getDislikedFoods())
                .prohibitedFoods(nutritionalData.getProhibitedFoods())
                .restrictions(nutritionalData.getRestrictions())
                .waterIntake(nutritionalData.getWaterIntake())
                .waterLitersPerDay(nutritionalData.getWaterLitersPerDay())
                .drinksWater(nutritionalData.getDrinksWater())
                .drinksSoda(nutritionalData.getDrinksSoda())
                .breakfastTime(nutritionalData.getBreakfastTime())
                .lunchTime(nutritionalData.getLunchTime())
                .snackTime(nutritionalData.getSnackTime())
                .dinnerTime(nutritionalData.getDinnerTime())
                .snackCount(nutritionalData.getSnackCount())
                .physicalActivity(nutritionalData.getPhysicalActivity())
                .sport(nutritionalData.getSport())
                .sportGoal(nutritionalData.getSportGoal())
                .competition(nutritionalData.getCompetition())
                .recreational(nutritionalData.getRecreational())
                .professionalSport(nutritionalData.getProfessionalSport())
                .position(nutritionalData.getPosition())
                .category(nutritionalData.getCategory())
                .coach(nutritionalData.getCoach())
                .trainingSessionsPerWeek(nutritionalData.getTrainingSessionsPerWeek())
                .activityFrequency(nutritionalData.getActivityFrequency())
                .activityIntensity(nutritionalData.getActivityIntensity())
                .activityDuration(nutritionalData.getActivityDuration())
                .trainingPlace(nutritionalData.getTrainingPlace())
                .strengthTraining(nutritionalData.getStrengthTraining())
                .cardioTraining(nutritionalData.getCardioTraining())
                .mobilityTraining(nutritionalData.getMobilityTraining())
                .otherTraining(nutritionalData.getOtherTraining())
                .observations(nutritionalData.getObservations())
                .build();
    }

    private LaboratoryResponseDTO toLaboratoryResponse(LaboratoryEntity laboratory) {
        return LaboratoryResponseDTO.builder()
                .id(laboratory.getId())
                .date(laboratory.getDate())
                .glucose(laboratory.getGlucose())
                .cholesterol(laboratory.getCholesterol())
                .hdl(laboratory.getHdl())
                .ldl(laboratory.getLdl())
                .triglycerides(laboratory.getTriglycerides())
                .vitaminD(laboratory.getVitaminD())
                .vitaminB12(laboratory.getVitaminB12())
                .iron(laboratory.getIron())
                .ferritin(laboratory.getFerritin())
                .insulin(laboratory.getInsulin())
                .hba1c(laboratory.getHba1c())
                .pcr(laboratory.getPcr())
                .ast(laboratory.getAst())
                .alt(laboratory.getAlt())
                .tsgo(laboratory.getTsgo())
                .tsgp(laboratory.getTsgp())
                .sodium(laboratory.getSodium())
                .potassium(laboratory.getPotassium())
                .calcium(laboratory.getCalcium())
                .magnesium(laboratory.getMagnesium())
                .phosphorus(laboratory.getPhosphorus())
                .proteins(laboratory.getProteins())
                .albumin(laboratory.getAlbumin())
                .cortisol(laboratory.getCortisol())
                .testosterone(laboratory.getTestosterone())
                .estradiol(laboratory.getEstradiol())
                .fsh(laboratory.getFsh())
                .lh(laboratory.getLh())
                .t3(laboratory.getT3())
                .tsh(laboratory.getTsh())
                .t4(laboratory.getT4())
                .hemoglobin(laboratory.getHemoglobin())
                .customParameters(laboratory.getCustomParameters())
                .observations(laboratory.getObservations())
                .build();
    }

    private AntropometryResponseDTO toAntropometryResponse(AntropometryEntity antropometry) {
        return AntropometryResponseDTO.builder()
                .id(antropometry.getId())
                .date(antropometry.getDate())
                .professionalName(antropometry.getProfessionalName())
                .source(antropometry.getSource())
                .height(antropometry.getHeight())
                .weight(antropometry.getWeight())
                .sittingHeight(antropometry.getSittingHeight())
                .anthropometricAge(antropometry.getAnthropometricAge())
                .anthropometricGoal(antropometry.getAnthropometricGoal())
                .headCircumference(antropometry.getHeadCircumference())
                .relaxedArmCircumference(antropometry.getRelaxedArmCircumference())
                .flexedArmCircumference(antropometry.getFlexedArmCircumference())
                .forearmCircumference(antropometry.getForearmCircumference())
                .thoraxCircumference(antropometry.getThoraxCircumference())
                .waist(antropometry.getWaist())
                .umbilicalWaist(antropometry.getUmbilicalWaist())
                .hips(antropometry.getHips())
                .maxThighCircumference(antropometry.getMaxThighCircumference())
                .medialThighCircumference(antropometry.getMedialThighCircumference())
                .calfCircumference(antropometry.getCalfCircumference())
                .biacromialDiameter(antropometry.getBiacromialDiameter())
                .transverseThoraxDiameter(antropometry.getTransverseThoraxDiameter())
                .anteroposteriorThoraxDiameter(antropometry.getAnteroposteriorThoraxDiameter())
                .biiliocristalDiameter(antropometry.getBiiliocristalDiameter())
                .humeralDiameter(antropometry.getHumeralDiameter())
                .femoralDiameter(antropometry.getFemoralDiameter())
                .tricepsSkinfold(antropometry.getTricepsSkinfold())
                .subscapularSkinfold(antropometry.getSubscapularSkinfold())
                .supraspinaleSkinfold(antropometry.getSupraspinaleSkinfold())
                .abdominalSkinfold(antropometry.getAbdominalSkinfold())
                .medialThighSkinfold(antropometry.getMedialThighSkinfold())
                .calfSkinfold(antropometry.getCalfSkinfold())
                .skinfoldSum(antropometry.getSkinfoldSum())
                .adiposeMassPercentage(antropometry.getAdiposeMassPercentage())
                .adiposeMassKg(antropometry.getAdiposeMassKg())
                .muscleMassPercentage(antropometry.getMuscleMassPercentage())
                .muscleMassKg(antropometry.getMuscleMassKg())
                .boneMassPercentage(antropometry.getBoneMassPercentage())
                .boneMassKg(antropometry.getBoneMassKg())
                .residualMassPercentage(antropometry.getResidualMassPercentage())
                .residualMassKg(antropometry.getResidualMassKg())
                .skinMassPercentage(antropometry.getSkinMassPercentage())
                .skinMassKg(antropometry.getSkinMassKg())
                .waistHipRatio(antropometry.getWaistHipRatio())
                .bmi(antropometry.getBmi())
                .bmr(antropometry.getBmr())
                .muscleBoneIndex(antropometry.getMuscleBoneIndex())
                .armMuscleArea(antropometry.getArmMuscleArea())
                .thighMuscleArea(antropometry.getThighMuscleArea())
                .calfMuscleArea(antropometry.getCalfMuscleArea())
                .zScore(antropometry.getZScore())
                .peakHeightVelocityAge(antropometry.getPeakHeightVelocityAge())
                .maturation(antropometry.getMaturation())
                .bsa(antropometry.getBsa())
                .arm(antropometry.getArm())
                .bodyFatPercentage(antropometry.getBodyFatPercentage())
                .muscleMass(antropometry.getMuscleMass())
                .softwareSource(antropometry.getSoftwareSource())
                .externalReference(antropometry.getExternalReference())
                .rawMeasurements(antropometry.getRawMeasurements())
                .observations(antropometry.getObservations())
                .build();
    }

    private ConsultationResponseDTO toConsultationResponse(ConsultationEntity consultation) {
        return ConsultationResponseDTO.builder()
                .id(consultation.getId())
                .date(consultation.getDate())
                .startTime(consultation.getStartTime())
                .endTime(consultation.getEndTime())
                .status(consultation.getStatus())
                .patientId(consultation.getPatient() != null ? consultation.getPatient().getId() : null)
                .appointmentId(consultation.getAppointment() != null ? consultation.getAppointment().getId() : null)
                .professionalId(consultation.getProfessional() != null ? consultation.getProfessional().getId() : null)
                .reason(consultation.getReason())
                .diagnosis(consultation.getDiagnosis())
                .treatment(consultation.getTreatment())
                .evolution(consultation.getEvolution())
                .goal(consultation.getGoal())
                .observations(consultation.getObservations())
                .indications(consultation.getIndications())
                .nextConsultation(consultation.getNextConsultation())
                .build();
    }

    private FoodPlanResponseDTO toFoodPlanResponse(FoodPlanEntity foodPlan) {
        return FoodPlanResponseDTO.builder()
                .id(foodPlan.getId())
                .title(foodPlan.getTitle())
                .description(foodPlan.getDescription())
                .startDate(foodPlan.getStartDate())
                .endDate(foodPlan.getEndDate())
                .active(foodPlan.getActive())
                .pdfUrl(foodPlan.getPdfUrl())
                .planDelivered(foodPlan.getPlanDelivered())
                .planDeliveredDate(foodPlan.getPlanDeliveredDate())
                .planDeliveryMedium(foodPlan.getPlanDeliveryMedium())
                .menuDelivered(foodPlan.getMenuDelivered())
                .menuDeliveredDate(foodPlan.getMenuDeliveredDate())
                .menuMaterialName(foodPlan.getMenuMaterialName())
                .menuMaterialUrl(foodPlan.getMenuMaterialUrl())
                .menu(foodPlan.getMenu())
                .notes(foodPlan.getNotes())
                .observations(foodPlan.getObservations())
                .totalCalories(foodPlan.getTotalCalories())
                .totalProtein(foodPlan.getTotalProtein())
                .totalCarbohydrates(foodPlan.getTotalCarbohydrates())
                .totalFat(foodPlan.getTotalFat())
                .build();
    }

    private ClinicalFileResponseDTO toClinicalFileResponse(ClinicalFileEntity file) {
        return ClinicalFileResponseDTO.builder()
                .id(file.getId())
                .originalName(file.getOriginalName())
                .contentType(file.getContentType())
                .size(file.getSize())
                .type(file.getType())
                .comment(file.getComment())
                .date(file.getFileDate())
                .professional(file.getProfessional())
                .previewable(isPreviewable(file.getContentType()))
                .build();
    }

    private MedicationDTO toMedicationResponse(MedicationEntity medication) {
        return MedicationDTO.builder()
                .id(medication.getId())
                .name(medication.getName())
                .dose(medication.getDose())
                .frequency(medication.getFrequency())
                .observations(medication.getObservations())
                .build();
    }

    private AllergyDTO toAllergyResponse(AllergyEntity allergy) {
        return AllergyDTO.builder()
                .id(allergy.getId())
                .type(allergy.getType())
                .name(allergy.getName())
                .severity(allergy.getSeverity())
                .observations(allergy.getObservations())
                .build();
    }

    private void replaceMedicationRecords(ClinicalDataEntity clinicalData, List<MedicationDTO> medications) {
        clinicalData.getMedicationRecords().clear();
        if (medications == null) {
            return;
        }

        medications.stream()
                .filter(item -> hasText(item.getName()) || hasText(item.getDose()) || hasText(item.getFrequency()) || hasText(item.getObservations()))
                .forEach(item -> {
                    MedicationEntity medication = new MedicationEntity();
                    medication.setClinicalData(clinicalData);
                    medication.setName(item.getName());
                    medication.setDose(item.getDose());
                    medication.setFrequency(item.getFrequency());
                    medication.setObservations(item.getObservations());
                    clinicalData.getMedicationRecords().add(medication);
                });
    }

    private void replaceAllergyRecords(ClinicalDataEntity clinicalData, List<AllergyDTO> allergies) {
        clinicalData.getAllergyRecords().clear();
        if (allergies == null) {
            return;
        }

        allergies.stream()
                .filter(item -> hasText(item.getType()) || hasText(item.getName()) || hasText(item.getSeverity()) || hasText(item.getObservations()))
                .forEach(item -> {
                    AllergyEntity allergy = new AllergyEntity();
                    allergy.setClinicalData(clinicalData);
                    allergy.setType(item.getType());
                    allergy.setName(item.getName());
                    allergy.setSeverity(item.getSeverity());
                    allergy.setObservations(item.getObservations());
                    clinicalData.getAllergyRecords().add(allergy);
                });
    }

    private boolean isPreviewable(String contentType) {
        return contentType != null && (contentType.startsWith("image/") || "application/pdf".equals(contentType));
    }

    private PatientResponseDTO toPatientResponse(PatientEntity patient) {
        if (patient == null) {
            return null;
        }
        return PatientResponseDTO.builder()
                .id(patient.getId())
                .firstName(patient.getFirstName())
                .lastName(patient.getLastName())
                .email(patient.getEmail())
                .mobile(patient.getMobile())
                .birthDate(patient.getBirthDate())
                .age(calculateAge(patient.getBirthDate()))
                .document(patient.getDocument())
                .status(patient.getStatus())
                .gender(patient.getGender())
                .build();
    }

    private Double calculateBmi(Double weight, Double height) {
        if (weight == null || height == null || weight <= 0 || height <= 0) {
            return null;
        }
        double heightInMeters = height > 3 ? height / 100D : height;
        return round(weight / (heightInMeters * heightInMeters));
    }

    private Double calculateWaistHipRatio(Double waist, Double hips) {
        if (waist == null || hips == null || waist <= 0 || hips <= 0) {
            return null;
        }
        return round(waist / hips);
    }

    private Double calculateBmr(Double weight, Double height, PatientEntity patient) {
        if (weight == null || height == null || patient == null || patient.getBirthDate() == null) {
            return null;
        }
        double heightInCentimeters = height > 3 ? height : height * 100D;
        int age = calculateAge(patient.getBirthDate());
        double genderFactor = switch (patient.getGender()) {
            case MALE -> 5D;
            case FEMALE -> -161D;
            default -> -78D;
        };
        return round((10D * weight) + (6.25D * heightInCentimeters) - (5D * age) + genderFactor);
    }

    private Double resolveBodyFat(AntropometryRequestDTO dto, PatientEntity patient, Double bmi) {
        if (dto.getBodyFatPercentage() != null) {
            return dto.getBodyFatPercentage();
        }
        if (bmi == null || patient == null || patient.getBirthDate() == null) {
            return null;
        }
        int age = calculateAge(patient.getBirthDate());
        int sex = patient.getGender() == GenderType.MALE ? 1 : 0;
        return round((1.2D * bmi) + (0.23D * age) - (10.8D * sex) - 5.4D);
    }

    private String resolveSoftwareSource(String softwareSource) {
        return softwareSource == null || softwareSource.isBlank() ? "AntroSport" : softwareSource;
    }

    private String resolveSource(String source, String softwareSource) {
        if (hasText(source)) {
            return source;
        }
        if (hasText(softwareSource) && softwareSource.toLowerCase().contains("antro")) {
            return "ANTROSPORT";
        }
        return MANUAL_SOURCE;
    }

    private String toJson(Object value) {
        if (value == null) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException ex) {
            throw new IllegalArgumentException("No se pudieron procesar las mediciones antropometricas");
        }
    }

    private List<String> fromJsonList(String value) {
        if (!hasText(value)) {
            return List.of();
        }
        try {
            return objectMapper.readValue(value, new TypeReference<>() {});
        } catch (JsonProcessingException ex) {
            return List.of(value);
        }
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private int calculateAge(LocalDate birthDate) {
        return Period.between(birthDate, LocalDate.now()).getYears();
    }

    private double round(double value) {
        return BigDecimal.valueOf(value).setScale(2, RoundingMode.HALF_UP).doubleValue();
    }
}
