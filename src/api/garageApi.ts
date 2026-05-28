import { API_BASE_URL } from '../constants/common';
import type { Car, CarPayload, GarageQuery, GarageResponse } from '../types/api';
import { getTotalCount, readJson } from './http';

function garageUrl(path = ''): string {
  return `${API_BASE_URL}/garage${path}`;
}

export async function fetchCars(params: GarageQuery): Promise<GarageResponse> {
  const searchParams = new URLSearchParams({
    _page: String(params.page),
    _limit: String(params.limit),
  });
  const response = await fetch(`${garageUrl()}?${searchParams.toString()}`);
  const cars = await readJson<Car[]>(response);

  return { cars, totalCount: getTotalCount(response) };
}

export async function createCar(payload: CarPayload): Promise<Car> {
  const response = await fetch(garageUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  return readJson<Car>(response);
}

export async function updateCar(id: number, payload: CarPayload): Promise<Car> {
  const response = await fetch(garageUrl(`/${id}`), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  return readJson<Car>(response);
}

export async function deleteCar(id: number): Promise<void> {
  const response = await fetch(garageUrl(`/${id}`), {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error(`Failed to delete car ${id}`);
  }
}
