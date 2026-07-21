export interface UserResponseDTO {
  id: number | string,
  username: string,
  isActive: boolean,
  passwordConfigured: boolean,
  email: string;
  roles: string[];
}

export interface AuthResponseDTO {
  token: string;
  tokenType: string;
  user: UserResponseDTO;
}

export interface AuthRequestDTO {
  email: string,
  password: string
}

export interface RegisterRequestDTO {
  username: string;
  email: string;
  roles: string[];
}

export interface UpdateUserDTO {
  username: string;
  email: string;
  isActive: boolean;
  roles: string[];
}

export interface RoleResponseDTO {
  id: number,
  name: string,
  description: string,
  hierarchy: number
}

export interface RoleRequestDTO {
  name: string,
  description: string,
  hierarchy: number
}
