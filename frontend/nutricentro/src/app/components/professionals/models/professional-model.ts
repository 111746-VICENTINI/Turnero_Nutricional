import {SpecialtyOnlyNameDTO} from '../specialties/models/specialty-model';

export interface ProfessionalRequestDTO {
  firstName: string,
  lastName: string,
  birthDate: string,
  document: number,
  specialtyIds: number[],
  tuition: string,
  mobile: string,
  gender: string, //GenderType gender;
  email: string,
  registration: string,
  status: string //personStatus
}

export interface ProfessionalResponseDTO {
  id:number,
  firstName: string,
  lastName: string,
  birthDate: string,
  mobile: string,
  gender: string, //GenderType gender;
  email: string,
  registration: string,
  tuition: string,
  document: number,
  status: string, //personStatus
  specialties: SpecialtyOnlyNameDTO[]
}

export interface ProfessionalUpdateDTO {
  firstName: string,
  lastName: string,
  birthDate: string,
  mobile: string,
  gender: string, //GenderType gender;
  email: string,
  registration: string,
  status: string //personStatus
  document: number,
  tuition: string,
  specialtyIds: number[];
}
