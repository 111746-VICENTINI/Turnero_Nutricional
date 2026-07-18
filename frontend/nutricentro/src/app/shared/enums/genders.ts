export enum GenderType {
  FEMALE = 'FEMALE',
  MALE = 'MALE',
  NON_BINARY = 'NON_BINARY',
  PREFER_NOT_TO_SAY = 'PREFER_NOT_TO_SAY'
}

export const Gender_Options = [
  { label: 'Femenino', value: GenderType.FEMALE },
  { label: 'Masculino', value: GenderType.MALE },
  { label: 'No binario', value: GenderType.NON_BINARY },
  { label: 'Prefiero no decirlo', value: GenderType.PREFER_NOT_TO_SAY }
];

export const Gender_Labels: Record<GenderType, string> = {
  [GenderType.FEMALE]: 'Femenino',
  [GenderType.MALE]: 'Masculino',
  [GenderType.NON_BINARY]: 'No binario',
  [GenderType.PREFER_NOT_TO_SAY]: 'Prefiero no decirlo'
};
