import { API_BASE_URL } from '../constants/common';
import type { DriveResponse, EngineResponse, EngineStatus } from '../types/race';
import { readJson } from './http';

function engineUrl(id: number, status: EngineStatus): string {
  const search = new URLSearchParams({ id: String(id), status });
  return `${API_BASE_URL}/engine?${search.toString()}`;
}

export async function setEngineStatus(id: number, status: EngineStatus): Promise<EngineResponse> {
  const response = await fetch(engineUrl(id, status), { method: 'PATCH' });
  return readJson<EngineResponse>(response);
}

export async function driveEngine(id: number): Promise<DriveResponse> {
  const response = await fetch(engineUrl(id, 'drive'), { method: 'PATCH' });
  if (!response.ok) {
    throw new Error(`Drive failed ${response.status}`);
  }
  return readJson<DriveResponse>(response);
}
