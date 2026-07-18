//back sin enum
export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE'
}

export const USER_STATUS_OPTIONS = [
  { label: 'Activo', value: UserStatus.ACTIVE },
  { label: 'Inactivo', value: UserStatus.INACTIVE },
];

export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  [UserStatus.ACTIVE]: 'Activo',
  [UserStatus.INACTIVE]: 'Inactivo'
};
