export enum PersonStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE'
}

export const PERSON_STATUS_OPTIONS = [
  { label: 'Activo', value: PersonStatus.ACTIVE },
  { label: 'Inactivo', value: PersonStatus.INACTIVE }
];

export const PERSON_STATUS_LABELS: Record<PersonStatus, string> = {
  [PersonStatus.ACTIVE]: 'Activo',
  [PersonStatus.INACTIVE]: 'Inactivo'
};
