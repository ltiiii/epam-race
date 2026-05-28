export type Car = {
  id: number;
  name: string;
  color: string;
};

export type CarPayload = Omit<Car, 'id'>;

export type GarageQuery = {
  page: number;
  limit: number;
};

export type GarageResponse = {
  cars: Car[];
  totalCount: number;
};

export type Winner = {
  id: number;
  wins: number;
  time: number;
};

export type WinnerWithCar = Winner & {
  car: Car | null;
};

export type WinnersSortField = 'wins' | 'time';
export type SortOrder = 'ASC' | 'DESC';

export type WinnersQuery = {
  page: number;
  limit: number;
  sort?: WinnersSortField;
  order?: SortOrder;
};

export type WinnersResponse = {
  winners: Winner[];
  totalCount: number;
};
