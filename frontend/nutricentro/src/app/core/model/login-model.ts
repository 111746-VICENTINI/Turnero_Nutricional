export interface UserResponseDTO {
  id: number | string,
  username: string,
  isActive: boolean,
  email: string;
  roles: string[];
}

export interface AuthResponseDTO {
  token: string;
  tokenType: string;
  user: UserResponseDTO;
}

export interface AuthRequestDTO {
  username?: string,
  password: string
}

export interface RegisterRequestDTO {
  username: string;
  email: string;
  password: string;
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
