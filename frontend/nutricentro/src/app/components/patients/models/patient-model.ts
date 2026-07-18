import {GenderType} from '../../../shared/enums/genders';
import {PersonStatus} from '../../../shared/enums/person-status';

export interface PatientRequestDTO {
  firstName: string,
  lastName: string,
  birthDate: string,
  document: number,
  mobile: string,
  gender: GenderType,
  email: string,
  status: PersonStatus,
  address?: string
}

export interface PatientResponseDTO {
  id: number,
  firstName: string,
  lastName: string,
  birthDate: string,
  age: number,
  document: number,
  mobile: string,
  gender: GenderType,
  email: string,
  status: PersonStatus,
  address?: string
}

export interface PatientUpdateDTO {
  firstName: string,
  lastName: string,
  birthDate: string,
  document: number,
  mobile: string,
  gender: GenderType,
  email: string,
  status: PersonStatus,
  address?: string
}
