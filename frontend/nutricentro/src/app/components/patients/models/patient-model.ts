export interface PatientRequestDTO {
  firstName: string,
  lastName: string,
  birthDate: string,
  document: number,
  mobile: string,
  gender: string, //GenderType gender;
  email: string,
  status: string, //personStatus
  address?: string
}

export interface PatientResponseDTO {
  id: number,
  firstName: string,
  lastName: string,
  birthDate: string,
  age: string,
  document: number,
  mobile: string,
  gender: string, //GenderType gender;
  email: string,
  status: string, //personStatus
  address?: string
}

export interface PatientUpdateDTO {
  firstName: string,
  lastName: string,
  birthDate: string,
  document: number,
  mobile: string,
  gender: string, //GenderType gender;
  email: string,
  status: string, //personStatus
  address?: string
}
