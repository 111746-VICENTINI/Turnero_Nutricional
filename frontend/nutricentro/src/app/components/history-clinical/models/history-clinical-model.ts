import { PatientResponseDTO } from '../../patients/models/patient-model';

export interface MedicalHistoryRequestDTO {
  patientId: number;
  professionalId?: number | null;
  consultationDate?: string | Date | null;
  consultationReason?: string | null;
  observations?: string | null;
}

export interface MedicalHistoryResponseDTO {
  id: number;
  consultationDate?: string | null;
  consultationReason?: string | null;
  observations?: string | null;
  patientId: number;
  patient?: PatientResponseDTO | null;
  professionalId?: number | null;
  nutritionalData?: NutritionalDataDTO | null;
  clinicalData?: ClinicalDataDTO | null;
  laboratories: LaboratoryResponseDTO[];
  anthropometries: AntropometryResponseDTO[];
  consultations: ConsultationResponseDTO[];
  foodPlans: FoodPlanResponseDTO[];
  files?: ClinicalFileResponseDTO[];
}

export interface ClinicalDataDTO {
  id?: number;
  employmentSituation?: string | null;
  occupation?: string | null;
  company?: string | null;
  workingHours?: string | null;
  workShift?: string | null;
  sedentaryWork?: boolean | null;
  activeWork?: boolean | null;
  nightWork?: boolean | null;
  livingSituation?: string | null;
  householdPeopleCount?: number | null;
  responsibleForFood?: string | null;
  cooksAtHome?: string | null;
  buysFood?: string | null;
  organizesMeals?: string | null;
  eatsOutsideHome?: boolean | null;
  pregnancies?: boolean | null;
  pregnancyCount?: number | null;
  lactation?: boolean | null;
  menopause?: boolean | null;
  menstrualCycle?: string | null;
  contraceptiveMethod?: string | null;
  smoker?: boolean | null;
  dailyCigarettes?: string | null;
  smokingStartDate?: string | null;
  alcohol?: boolean | null;
  alcoholFrequency?: string | null;
  alcoholicBeverageType?: string | null;
  caffeine?: boolean | null;
  mate?: boolean | null;
  energyDrinks?: boolean | null;
  recreationalDrugs?: boolean | null;
  supplements?: boolean | null;
  supplementationDetails?: string | null;
  sleepHoursPerNight?: number | null;
  sleepQuality?: string | null;
  wakesUpAtNight?: boolean | null;
  snores?: boolean | null;
  diagnosedApnea?: boolean | null;
  stressLevel?: string | null;
  anxiety?: boolean | null;
  depression?: boolean | null;
  emotionalEating?: boolean | null;
  bingeEating?: boolean | null;
  snacking?: boolean | null;
  nightHunger?: boolean | null;
  heartburn?: boolean | null;
  reflux?: boolean | null;
  constipation?: boolean | null;
  diarrhea?: boolean | null;
  abdominalDistension?: boolean | null;
  irritableBowel?: boolean | null;
  abdominalPain?: boolean | null;
  pathologies?: string[] | null;
  diseases?: string | null;
  allergies?: string | null;
  medications?: string | null;
  medicationRecords?: MedicationDTO[];
  allergyRecords?: AllergyDTO[];
  familyHistory?: string | null;
  surgeries?: string | null;
  observations?: string | null;
}

export interface MedicationDTO {
  id?: number;
  name?: string | null;
  dose?: string | null;
  frequency?: string | null;
  observations?: string | null;
}

export interface AllergyDTO {
  id?: number;
  type?: string | null;
  name?: string | null;
  severity?: string | null;
  observations?: string | null;
}

export interface NutritionalDataDTO {
  id?: number;
  dietType?: string | null;
  preferences?: string | null;
  breakfast?: string | null;
  midMorningSnack?: string | null;
  lunch?: string | null;
  snack?: string | null;
  midAfternoonSnack?: string | null;
  dinner?: string | null;
  favoriteFoods?: string | null;
  dislikedFoods?: string | null;
  prohibitedFoods?: string | null;
  restrictions?: string | null;
  waterIntake?: string | null;
  waterLitersPerDay?: number | null;
  drinksWater?: boolean | null;
  drinksSoda?: boolean | null;
  breakfastTime?: string | null;
  lunchTime?: string | null;
  snackTime?: string | null;
  dinnerTime?: string | null;
  snackCount?: number | null;
  physicalActivity?: string | null;
  sport?: string | null;
  sportGoal?: string | null;
  competition?: boolean | null;
  recreational?: boolean | null;
  professionalSport?: boolean | null;
  position?: string | null;
  category?: string | null;
  coach?: string | null;
  trainingSessionsPerWeek?: number | null;
  activityFrequency?: string | null;
  activityIntensity?: string | null;
  activityDuration?: string | null;
  trainingPlace?: string | null;
  strengthTraining?: boolean | null;
  cardioTraining?: boolean | null;
  mobilityTraining?: boolean | null;
  otherTraining?: string | null;
  observations?: string | null;
}

export interface LaboratoryRequestDTO {
  date?: string | Date | null;
  glucose?: number | null;
  cholesterol?: number | null;
  hdl?: number | null;
  ldl?: number | null;
  triglycerides?: number | null;
  vitaminD?: number | null;
  vitaminB12?: number | null;
  iron?: number | null;
  ferritin?: number | null;
  insulin?: number | null;
  hba1c?: number | null;
  pcr?: number | null;
  ast?: number | null;
  alt?: number | null;
  tsgo?: number | null;
  tsgp?: number | null;
  sodium?: number | null;
  potassium?: number | null;
  calcium?: number | null;
  magnesium?: number | null;
  phosphorus?: number | null;
  proteins?: number | null;
  albumin?: number | null;
  cortisol?: number | null;
  testosterone?: number | null;
  estradiol?: number | null;
  fsh?: number | null;
  lh?: number | null;
  t3?: number | null;
  tsh?: number | null;
  t4?: number | null;
  hemoglobin?: number | null;
  customParameters?: string | null;
  observations?: string | null;
}

export interface LaboratoryResponseDTO extends LaboratoryRequestDTO {
  id: number;
}

export interface AntropometryRequestDTO {
  date?: string | Date | null;
  professionalName?: string | null;
  source?: string | null;
  weight?: number | null;
  height?: number | null;
  sittingHeight?: number | null;
  anthropometricAge?: number | null;
  anthropometricGoal?: string | null;
  headCircumference?: number | null;
  relaxedArmCircumference?: number | null;
  flexedArmCircumference?: number | null;
  forearmCircumference?: number | null;
  thoraxCircumference?: number | null;
  waist?: number | null;
  umbilicalWaist?: number | null;
  hips?: number | null;
  maxThighCircumference?: number | null;
  medialThighCircumference?: number | null;
  calfCircumference?: number | null;
  biacromialDiameter?: number | null;
  transverseThoraxDiameter?: number | null;
  anteroposteriorThoraxDiameter?: number | null;
  biiliocristalDiameter?: number | null;
  humeralDiameter?: number | null;
  femoralDiameter?: number | null;
  tricepsSkinfold?: number | null;
  subscapularSkinfold?: number | null;
  supraspinaleSkinfold?: number | null;
  abdominalSkinfold?: number | null;
  medialThighSkinfold?: number | null;
  calfSkinfold?: number | null;
  skinfoldSum?: number | null;
  adiposeMassPercentage?: number | null;
  adiposeMassKg?: number | null;
  muscleMassPercentage?: number | null;
  muscleMassKg?: number | null;
  boneMassPercentage?: number | null;
  boneMassKg?: number | null;
  residualMassPercentage?: number | null;
  residualMassKg?: number | null;
  skinMassPercentage?: number | null;
  skinMassKg?: number | null;
  arm?: number | null;
  bodyFatPercentage?: number | null;
  muscleMass?: number | null;
  muscleBoneIndex?: number | null;
  armMuscleArea?: number | null;
  thighMuscleArea?: number | null;
  calfMuscleArea?: number | null;
  zScore?: number | null;
  peakHeightVelocityAge?: number | null;
  maturation?: string | null;
  bsa?: number | null;
  softwareSource?: string | null;
  externalReference?: string | null;
  rawMeasurements?: Record<string, number> | null;
  observations?: string | null;
}

export interface AntropometryResponseDTO extends Omit<AntropometryRequestDTO, 'rawMeasurements'> {
  id: number;
  waistHipRatio?: number | null;
  bmi?: number | null;
  bmr?: number | null;
  rawMeasurements?: Record<string, number> | string | null;
}

export interface ConsultationRequestDTO {
  date?: string | Date | null;
  startTime?: string | null;
  endTime?: string | null;
  status?: 'BORRADOR' | 'EN_CURSO' | 'FINALIZADA' | null;
  patientId?: number | null;
  appointmentId?: number | null;
  professionalId?: number | null;
  reason?: string | null;
  diagnosis?: string | null;
  treatment?: string | null;
  goal?: string | null;
  evolution?: string | null;
  observations?: string | null;
  indications?: string | null;
  nextConsultation?: string | null;
}

export interface ConsultationResponseDTO extends ConsultationRequestDTO {
  id: number;
}

export interface FoodPlanItemDTO {
  foodId?: number | null;
  externalId?: string | null;
  name?: string | null;
  grams?: number | null;
  calories?: number | null;
  protein?: number | null;
  carbohydrates?: number | null;
  fat?: number | null;
}

export interface FoodPlanRequestDTO {
  title?: string | null;
  description?: string | null;
  startDate?: string | Date | null;
  endDate?: string | Date | null;
  active?: boolean | null;
  pdfUrl?: string | null;
  planDelivered?: boolean | null;
  planDeliveredDate?: string | Date | null;
  planDeliveryMedium?: string | null;
  menuDelivered?: boolean | null;
  menuDeliveredDate?: string | Date | null;
  menuMaterialName?: string | null;
  menuMaterialUrl?: string | null;
  menu?: string | null;
  notes?: string | null;
  observations?: string | null;
  items?: FoodPlanItemDTO[];
}

export interface FoodPlanResponseDTO extends FoodPlanRequestDTO {
  id: number;
  totalCalories?: number | null;
  totalProtein?: number | null;
  totalCarbohydrates?: number | null;
  totalFat?: number | null;
}

export interface ClinicalFileResponseDTO {
  id: number;
  originalName: string;
  contentType: string;
  size: number;
  type: string;
  comment?: string | null;
  date?: string | Date | null;
  professional?: string | null;
  previewable?: boolean | null;
}

export interface MenuMaterialDTO {
  delivered?: boolean | null;
  deliveredDate?: string | Date | null;
  materialName?: string | null;
  materialUrl?: string | null;
}

export interface FoodResponseDTO {
  id?: number;
  externalId?: string | null;
  name: string;
  brand?: string | null;
  calories?: number | null;
  protein?: number | null;
  carbohydrates?: number | null;
  fat?: number | null;
  healthyFat?: number | null;
  imageUrl?: string | null;
  source?: string | null;
}

export interface FoodRequestDTO {
  externalId?: string | null;
  name: string;
  calories?: number | null;
  protein?: number | null;
  carbohydrates?: number | null;
  fat?: number | null;
  healthyFat?: number | null;
  source?: string | null;
}
