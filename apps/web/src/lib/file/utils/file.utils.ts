import type { CommonFileFragment } from '@/lib/api/types';

import { FILE_EXTENSIONS } from '../constants/file-types';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const AGE_UNITS = [
  { unit: 'year', size: 365 * DAY },
  { unit: 'month', size: 30 * DAY },
  { unit: 'day', size: DAY },
  { unit: 'hour', size: HOUR }
];

export const getFileName = ({ name, type }: Pick<CommonFileFragment, 'name' | 'type'>) =>
  `${name}.${FILE_EXTENSIONS[type]}`;

export const filterFiles = <TFile extends Pick<CommonFileFragment, 'name' | 'type'>>(
  files: TFile[],
  search: string
) => {
  const query = search.trim().toLowerCase();

  return files.filter(file => getFileName(file).toLowerCase().includes(query));
};

export const formatFileAge = (updatedAt: string, locale: string, now = Date.now()) => {
  const age = Math.max(0, now - new Date(updatedAt).getTime());
  const { unit, size } = AGE_UNITS.find(({ size }) => age >= size) ?? {
    unit: 'minute',
    size: MINUTE
  };
  const format = new Intl.NumberFormat(locale, { style: 'unit', unit, unitDisplay: 'narrow' });

  return format.format(Math.max(1, Math.floor(age / size)));
};
