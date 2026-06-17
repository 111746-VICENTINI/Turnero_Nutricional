export interface SpecialtyResponseDTO {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
}

export interface SpecialtyRequestDTO {
  name: string;
  description: string;
  isActive: boolean;
}

export interface SpecialtyUpdateDTO {
  name: string;
  description: string;
  isActive: boolean;
}

export interface SpecialtyOnlyNameDTO {
  id: number;
  name: string;
}
