export async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

export function getTotalCount(response: Response): number {
  const totalCountHeader = response.headers.get('X-Total-Count');
  const parsedCount = Number(totalCountHeader);

  return Number.isNaN(parsedCount) ? 0 : parsedCount;
}
