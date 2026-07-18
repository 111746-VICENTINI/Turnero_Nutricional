import {SpecialtyOnlyNameDTO} from '../specialties/models/specialty-model';
import {GenderType} from '../../../shared/enums/genders';
import {PersonStatus} from '../../../shared/enums/person-status';

export interface ProfessionalRequestDTO {
  firstName: string,
  lastName: string,
  birthDate: string,
  document: number,
  specialtyIds: number[],
  tuition: string,
  mobile: string,
  gender: GenderType,
  email: string,
  registration: string,
  status: PersonStatus,
  firstConsultationFee?: number,
  followUpConsultationFee?: number,
  onlineConsultationFee?: number,
  feeCurrency?: string,
  allowAppointmentFeeOverride?: boolean
}

export interface ProfessionalResponseDTO {
  id:number,
  firstName: string,
  lastName: string,
  birthDate: string,
  mobile: string,
  gender: GenderType,
  email: string,
  registration: string,
  tuition: string,
  document: number,
  status: PersonStatus,
  specialties: SpecialtyOnlyNameDTO[],
  firstConsultationFee?: number,
  followUpConsultationFee?: number,
  onlineConsultationFee?: number,
  feeCurrency?: string,
  allowAppointmentFeeOverride?: boolean
}

export interface ProfessionalUpdateDTO {
  firstName: string,
  lastName: string,
  birthDate: string,
  mobile: string,
  gender: GenderType,
  email: string,
  registration: string,
  status: PersonStatus,
  document: number,
  tuition: string,
  specialtyIds: number[];
  firstConsultationFee?: number,
  followUpConsultationFee?: number,
  onlineConsultationFee?: number,
  feeCurrency?: string,
  allowAppointmentFeeOverride?: boolean
}
