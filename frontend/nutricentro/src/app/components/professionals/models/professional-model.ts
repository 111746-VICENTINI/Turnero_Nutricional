export interface ProfessionalRequestDTO {
  firstName: string,
  lastName: string,
  age: string,
  birthDate: string,
  document: number,
  specialty: string,
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
  status: string, //personStatus
  specialty: string
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
  specialty: string
}
