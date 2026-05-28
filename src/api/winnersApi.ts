import { API_BASE_URL } from '../constants/common';
import type { Car, WinnersQuery, WinnersResponse, Winner } from '../types/api';
import { getTotalCount, readJson } from './http';

function winnersUrl(path = ''): string {
  return `${API_BASE_URL}/winners${path}`;
}

function garageUrl(path = ''): string {
  return `${API_BASE_URL}/garage${path}`;
}

export async function fetchWinners(params: WinnersQuery): Promise<WinnersResponse> {
  const searchParams = new URLSearchParams({
    _page: String(params.page),
    _limit: String(params.limit),
  });

  if (params.sort) searchParams.set('_sort', params.sort);
  if (params.order) searchParams.set('_order', params.order);

  const response = await fetch(`${winnersUrl()}?${searchParams.toString()}`);
  const winners = await readJson<Winner[]>(response);

  return { winners, totalCount: getTotalCount(response) };
}

export async function fetchCarById(id: number): Promise<Car | null> {
  const response = await fetch(garageUrl(`/${id}`));
  if (response.status === 404) return null;
  return readJson<Car>(response);
}

export async function fetchWinnerById(id: number): Promise<Winner | null> {
  const response = await fetch(winnersUrl(`/${id}`));
  if (response.status === 404) return null;
  return readJson<Winner>(response);
}

export async function createWinner(payload: Winner): Promise<Winner> {
  const response = await fetch(winnersUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return readJson<Winner>(response);
}

export async function updateWinner(id: number, payload: Omit<Winner, 'id'>): Promise<Winner> {
  const response = await fetch(winnersUrl(`/${id}`), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return readJson<Winner>(response);
}

export async function deleteWinner(id: number): Promise<void> {
  const response = await fetch(winnersUrl(`/${id}`), { method: 'DELETE' });
  if (!response.ok && response.status !== 404) {
    throw new Error(`Failed to delete winner ${id}`);
  }
}
