const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const LOCAL_DATE_PATTERN = /^(\d{2})\/(\d{2})\/(\d{4})$/;
const TIME_PATTERN = /^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/;

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function createValidDate(year: number, month: number, day: number): Date | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }

  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

export function parseLocalDate(value: unknown): Date | null {
  if (!value) {
    return null;
  }

  if (Array.isArray(value) && value.length >= 3) {
    return createValidDate(Number(value[0]), Number(value[1]), Number(value[2]));
  }

  if (typeof value === 'number') {
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  }

  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }

  if (typeof value !== 'string') {
    return null;
  }

  const isoMatch = ISO_DATE_PATTERN.exec(value);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return createValidDate(Number(year), Number(month), Number(day));
  }

  const localMatch = LOCAL_DATE_PATTERN.exec(value);
  if (localMatch) {
    const [, day, month, year] = localMatch;
    return createValidDate(Number(year), Number(month), Number(day));
  }

  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? null : parsed;
}

export function formatLocalDate(value: unknown): string {
  const date = parseLocalDate(value);
  if (!date) {
    return value ? String(value) : '-';
  }

  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

export function toIsoLocalDate(value: unknown): string {
  if (!value) {
    return '';
  }

  if (typeof value === 'string' && ISO_DATE_PATTERN.test(value)) {
    return value;
  }

  const date = parseLocalDate(value);
  if (!date) {
    return String(value);
  }

  return [date.getFullYear(), pad(date.getMonth() + 1), pad(date.getDate())].join('-');
}

export function parseLocalTime(value: unknown): Date | null {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }

  if (typeof value !== 'string') {
    return null;
  }

  const match = TIME_PATTERN.exec(value);
  if (!match) {
    return null;
  }

  const [, hours, minutes, seconds = '0'] = match;
  const date = new Date();
  date.setHours(Number(hours), Number(minutes), Number(seconds), 0);
  return date;
}

export function toIsoLocalTime(value: unknown): string {
  if (!value) {
    return '';
  }

  if (typeof value === 'string' && TIME_PATTERN.test(value)) {
    const [, hours, minutes, seconds = '00'] = TIME_PATTERN.exec(value)!;
    return `${pad(Number(hours))}:${pad(Number(minutes))}:${pad(Number(seconds))}`;
  }

  const date = parseLocalTime(value);
  if (!date) {
    return String(value);
  }

  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export function formatLocalTime(value: unknown): string {
  if (!value) {
    return '-';
  }

  if (Array.isArray(value) && value.length >= 2) {
    return `${pad(Number(value[0]))}:${pad(Number(value[1]))}`;
  }

  if (value instanceof Date) {
    return `${pad(value.getHours())}:${pad(value.getMinutes())}`;
  }

  if (typeof value === 'string') {
    const match = TIME_PATTERN.exec(value);
    if (match) {
      return `${pad(Number(match[1]))}:${pad(Number(match[2]))}`;
    }
  }

  return String(value);
}
