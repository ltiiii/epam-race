import type { CarPayload } from '../types/api';

const BRANDS = [
  'Tesla',
  'Ford',
  'BMW',
  'Audi',
  'Toyota',
  'Honda',
  'Nissan',
  'Chevrolet',
  'Porsche',
  'Lexus',
];

const MODELS = [
  'Model S',
  'Mustang',
  'M3',
  'RS 7',
  'Supra',
  'Civic',
  'GT-R',
  'Camaro',
  '911',
  'RX',
];

function randomInt(max: number): number {
  return Math.floor(Math.random() * max);
}

export function randomColor(): string {
  const value = randomInt(0xffffff + 1);
  return `#${value.toString(16).padStart(6, '0')}`;
}

export function randomCarName(): string {
  const brand = BRANDS[randomInt(BRANDS.length)];
  const model = MODELS[randomInt(MODELS.length)];
  return `${brand} ${model}`;
}

export function generateRandomCars(count: number): CarPayload[] {
  return Array.from({ length: count }, () => ({
    name: randomCarName(),
    color: randomColor(),
  }));
}
