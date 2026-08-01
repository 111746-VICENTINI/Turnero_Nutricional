import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../enviroment/enviroment';
import {
  AntropometryRequestDTO,
  AntropometryResponseDTO,
  ClinicalImportPreviewDTO,
  ClinicalDataDTO,
  ClinicalFileResponseDTO,
  ConsultationRequestDTO,
  ConsultationResponseDTO,
  FoodPlanRequestDTO,
  FoodPlanResponseDTO,
  FoodResponseDTO,
  LaboratoryRequestDTO,
  LaboratoryResponseDTO,
  MedicalHistoryRequestDTO,
  MedicalHistoryResponseDTO,
  MenuMaterialDTO,
  NutritionalDataDTO,
} from '../models/history-clinical-model';

@Injectable({
  providedIn: 'root',
})
export class HistoryClinicalService {
  private http = inject(HttpClient);
  private readonly historyUrl = `${environment.apiUrl}/medical-history`;
  private readonly foodUrl = `${environment.apiUrl}/food`;

  createOrUpdateHistory(request: MedicalHistoryRequestDTO) {
    return this.http.post<MedicalHistoryResponseDTO>(this.historyUrl, request);
  }

  getByPatientId(patientId: number) {
    return this.http.get<MedicalHistoryResponseDTO>(`${this.historyUrl}/patient/${patientId}`);
  }

  updateClinicalData(historyId: number, request: ClinicalDataDTO) {
    return this.http.put<ClinicalDataDTO>(`${this.historyUrl}/${historyId}/clinical-data`, request);
  }

  updateNutritionalData(historyId: number, request: NutritionalDataDTO) {
    return this.http.put<NutritionalDataDTO>(`${this.historyUrl}/${historyId}/nutritional-data`, request);
  }

  addLaboratory(historyId: number, request: LaboratoryRequestDTO) {
    return this.http.post<LaboratoryResponseDTO>(`${this.historyUrl}/${historyId}/laboratory`, request);
  }

  previewLaboratoryImport(historyId: number, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ClinicalImportPreviewDTO>(
      `${this.historyUrl}/${historyId}/laboratory/import/preview`,
      formData
    );
  }

  confirmLaboratoryImport(historyId: number, request: LaboratoryRequestDTO) {
    return this.http.post<LaboratoryResponseDTO>(
      `${this.historyUrl}/${historyId}/laboratory/import/confirm`,
      request
    );
  }

  updateLaboratory(laboratoryId: number, request: LaboratoryRequestDTO) {
    return this.http.put<LaboratoryResponseDTO>(`${this.historyUrl}/laboratory/${laboratoryId}`, request);
  }

  deleteLaboratory(laboratoryId: number) {
    return this.http.delete<void>(`${this.historyUrl}/laboratory/${laboratoryId}`);
  }

  addAnthropometry(historyId: number, request: AntropometryRequestDTO) {
    return this.http.post<AntropometryResponseDTO>(
      `${this.historyUrl}/${historyId}/anthropometry`,
      request
    );
  }

  previewAnthropometryImport(historyId: number, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ClinicalImportPreviewDTO>(
      `${this.historyUrl}/${historyId}/anthropometry/import/preview`,
      formData
    );
  }

  confirmAnthropometryImport(historyId: number, request: AntropometryRequestDTO) {
    return this.http.post<AntropometryResponseDTO>(
      `${this.historyUrl}/${historyId}/anthropometry/import/confirm`,
      request
    );
  }

  updateAnthropometry(anthropometryId: number, request: AntropometryRequestDTO) {
    return this.http.put<AntropometryResponseDTO>(
      `${this.historyUrl}/anthropometry/${anthropometryId}`,
      request
    );
  }

  deleteAnthropometry(anthropometryId: number) {
    return this.http.delete<void>(`${this.historyUrl}/anthropometry/${anthropometryId}`);
  }

  addConsultation(historyId: number, request: ConsultationRequestDTO) {
    return this.http.post<ConsultationResponseDTO>(
      `${this.historyUrl}/${historyId}/consultations`,
      request
    );
  }

  updateConsultation(consultationId: number, request: ConsultationRequestDTO) {
    return this.http.put<ConsultationResponseDTO>(
      `${this.historyUrl}/consultations/${consultationId}`,
      request
    );
  }

  deleteConsultation(consultationId: number) {
    return this.http.delete<void>(`${this.historyUrl}/consultations/${consultationId}`);
  }

  createFoodPlan(historyId: number, request: FoodPlanRequestDTO) {
    return this.http.post<FoodPlanResponseDTO>(`${this.historyUrl}/${historyId}/food-plans`, request);
  }

  updateFoodPlan(foodPlanId: number, request: FoodPlanRequestDTO) {
    return this.http.put<FoodPlanResponseDTO>(`${this.historyUrl}/food-plans/${foodPlanId}`, request);
  }

  deleteFoodPlan(foodPlanId: number) {
    return this.http.delete<void>(`${this.historyUrl}/food-plans/${foodPlanId}`);
  }

  updateMenuMaterial(foodPlanId: number, request: MenuMaterialDTO) {
    return this.http.patch<FoodPlanResponseDTO>(
      `${this.historyUrl}/food-plans/${foodPlanId}/menu-material`,
      request
    );
  }

  searchFoods(query: string) {
    const params = new HttpParams().set('query', query);
    return this.http.get<FoodResponseDTO[]>(`${this.foodUrl}/search`, { params });
  }

  listFiles(historyId: number) {
    return this.http.get<ClinicalFileResponseDTO[]>(`${this.historyUrl}/${historyId}/files`);
  }

  uploadFile(
    historyId: number,
    file: File,
    type: string,
    comment: string,
    date: string,
    professional: string
  ) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    if (comment) {
      formData.append('comment', comment);
    }

    if (date) {
      formData.append('date', date);
    }

    if (professional) {
      formData.append('professional', professional);
    }

    return this.http.post<ClinicalFileResponseDTO>(`${this.historyUrl}/${historyId}/files`, formData);
  }

  deleteFile(fileId: number) {
    return this.http.delete<void>(`${this.historyUrl}/files/${fileId}`);
  }

  previewFile(fileId: number) {
    return this.http.get(`${this.historyUrl}/files/${fileId}/preview`, {
      responseType: 'blob',
    });
  }

  downloadFile(fileId: number) {
    return this.http.get(`${this.historyUrl}/files/${fileId}/download`, {
      responseType: 'blob',
    });
  }
}
