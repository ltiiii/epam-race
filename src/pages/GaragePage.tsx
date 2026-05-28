import { useEffect, type ChangeEvent, type FormEvent } from 'react';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { GARAGE_PAGE_SIZE, MAX_CAR_NAME_LENGTH } from '../constants/common';
import {
  createRandomCarsThunk,
  createCarThunk,
  deleteCarThunk,
  loadCars,
  selectCar,
  updateCarThunk,
} from '../features/garage/garageSlice';
import { resetCarsState, startCar, startRace, stopCar } from '../features/race/raceSlice';
import {
  setCreateColor,
  setCreateName,
  setEditColor,
  setEditName,
  setGaragePage,
} from '../features/ui/uiSlice';
import type { Car } from '../types/api';

function useGarageLoader(): void {
  const dispatch = useAppDispatch();
  const page = useAppSelector((s) => s.ui.garagePage);

  useEffect(() => {
    dispatch(loadCars()).catch(() => null);
  }, [dispatch, page]);
}

function GarageForms(): JSX.Element {
  const dispatch = useAppDispatch();
  const ui = useAppSelector((s) => s.ui);
  const { selectedCarId, randomCreating } = useAppSelector((s) => s.garage);
  const raceRunning = useAppSelector((s) => s.race.raceRunning);
  const { onCreate, onUpdate } = useGarageFormActions();

  return (
    <>
      <CreateForm
        name={ui.createName}
        color={ui.createColor}
        onName={(value) => dispatch(setCreateName(value))}
        onColor={(value) => dispatch(setCreateColor(value))}
        onSubmit={onCreate}
        disabled={raceRunning}
      />
      <UpdateForm
        name={ui.editName}
        color={ui.editColor}
        onName={(value) => dispatch(setEditName(value))}
        onColor={(value) => dispatch(setEditColor(value))}
        onSubmit={onUpdate}
        disabled={raceRunning || !selectedCarId}
      />
      <GenerateButton randomCreating={randomCreating || raceRunning} />
    </>
  );
}

function useGarageFormActions(): {
  onCreate: (event: FormEvent<HTMLFormElement>) => void;
  onUpdate: (event: FormEvent<HTMLFormElement>) => void;
} {
  const dispatch = useAppDispatch();
  const ui = useAppSelector((s) => s.ui);
  const selectedCarId = useAppSelector((s) => s.garage.selectedCarId);

  const onCreate = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const name = ui.createName.trim();
    if (!name || name.length > MAX_CAR_NAME_LENGTH) return;
    dispatch(createCarThunk({ name, color: ui.createColor }))
      .then(() => dispatch(loadCars()))
      .catch(() => null);
    dispatch(setCreateName(''));
  };

  const onUpdate = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const name = ui.editName.trim();
    if (!selectedCarId || !name || name.length > MAX_CAR_NAME_LENGTH) return;
    dispatch(updateCarThunk({ id: selectedCarId, car: { name, color: ui.editColor } }))
      .then(() => dispatch(loadCars()))
      .catch(() => null);
  };

  return { onCreate, onUpdate };
}

type CarFormProps = {
  name: string;
  color: string;
  disabled: boolean;
  onName: (value: string) => void;
  onColor: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

function CreateForm(props: CarFormProps): JSX.Element {
  return (
    <form onSubmit={props.onSubmit} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
      <input value={props.name} onChange={(e: ChangeEvent<HTMLInputElement>) => props.onName(e.target.value)} placeholder="Car name" disabled={props.disabled} />
      <input type="color" value={props.color} onChange={(e: ChangeEvent<HTMLInputElement>) => props.onColor(e.target.value)} disabled={props.disabled} />
      <button type="submit" disabled={props.disabled}>Create</button>
    </form>
  );
}

function UpdateForm(props: CarFormProps): JSX.Element {
  return (
    <form onSubmit={props.onSubmit} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
      <input value={props.name} onChange={(e: ChangeEvent<HTMLInputElement>) => props.onName(e.target.value)} placeholder="Edit name" disabled={props.disabled} />
      <input type="color" value={props.color} onChange={(e: ChangeEvent<HTMLInputElement>) => props.onColor(e.target.value)} />
      <button type="submit" disabled={props.disabled}>Update</button>
    </form>
  );
}

function GenerateButton({ randomCreating }: { randomCreating: boolean }): JSX.Element {
  const dispatch = useAppDispatch();

  return (
    <button
      type="button"
      onClick={() => {
        dispatch(createRandomCarsThunk())
          .then(() => dispatch(loadCars()))
          .catch(() => null);
      }}
      disabled={randomCreating}
      style={{ marginBottom: 16 }}
    >
      {randomCreating ? 'Generating...' : 'Generate 100 cars'}
    </button>
  );
}

function GarageList(): JSX.Element {
  const dispatch = useAppDispatch();
  const { cars, loading, error } = useAppSelector((s) => s.garage);
  const page = useAppSelector((s) => s.ui.garagePage);
  const raceRunning = useAppSelector((s) => s.race.raceRunning);

  const onDelete = (id: number): void => {
    if (raceRunning) return;
    dispatch(deleteCarThunk(id))
      .then(() => {
        if (cars.length === 1 && page > 1) dispatch(setGaragePage(page - 1));
        dispatch(loadCars()).catch(() => null);
      })
      .catch(() => null);
  };

  const onSelect = (car: Car): void => {
    dispatch(selectCar(car.id));
    dispatch(setEditName(car.name));
    dispatch(setEditColor(car.color));
  };

  if (error) return <p>{error}</p>;
  if (loading) return <p>Loading...</p>;
  if (cars.length === 0) return <p>No cars</p>;

  return (
    <>
      {cars.map((car) => (
        <CarRow
          key={car.id}
          car={car}
          raceRunning={raceRunning}
          onDelete={() => onDelete(car.id)}
          onSelect={() => onSelect(car)}
        />
      ))}
    </>
  );
}

function getCarOffset(status: string): string {
  if (status === 'driving' || status === 'finished') return 'calc(100vw - 640px)';
  return '0px';
}

function CarRow(props: {
  car: Car;
  raceRunning: boolean;
  onDelete: () => void;
  onSelect: () => void;
}): JSX.Element {
  const dispatch = useAppDispatch();
  const raceState = useAppSelector(
    (s) => s.race.byCarId[props.car.id] ?? { status: 'idle', durationMs: 0 },
  );
  const canStart = raceState.status === 'idle' || raceState.status === 'broken';
  const canStop = raceState.status === 'driving' || raceState.status === 'starting';
  const isBroken = raceState.status === 'broken';
  const onStart = (): void => {
    dispatch(startCar(props.car))
      .catch(() => null);
  };
  const onStop = (): void => {
    dispatch(stopCar(props.car.id))
      .catch(() => null);
  };

  return (
    <article style={{ marginBottom: 14 }}>
      <button type="button" disabled={!canStart || props.raceRunning} onClick={onStart}>
        A
      </button>
      <button type="button" disabled={!canStop} onClick={onStop}>
        B
      </button>
      <button type="button" disabled={props.raceRunning} onClick={props.onSelect}>Select</button>
      <button type="button" disabled={props.raceRunning} onClick={props.onDelete}>Remove</button>
      <span style={{ marginLeft: 8 }}>{props.car.name}</span>
      <CarTrack color={props.car.color} status={raceState.status} durationMs={raceState.durationMs} />
      {isBroken ? <small>Engine broke down</small> : null}
    </article>
  );
}

function CarTrack(props: { color: string; status: string; durationMs: number }): JSX.Element {
  return (
    <div style={{ borderBottom: '2px dashed #999', marginTop: 6, minHeight: 24, overflow: 'hidden', position: 'relative' }}>
      <div
        aria-label="car"
        style={{
          backgroundColor: props.color,
          borderRadius: 4,
          height: 14,
          transform: `translateX(${getCarOffset(props.status)})`,
          transition: `transform ${Math.max(300, props.durationMs)}ms linear`,
          width: 48,
        }}
      />
    </div>
  );
}

function RaceControls(): JSX.Element {
  const dispatch = useAppDispatch();
  const cars = useAppSelector((s) => s.garage.cars);
  const raceRunning = useAppSelector((s) => s.race.raceRunning);
  const winnerMessage = useAppSelector((s) => s.race.winnerMessage);

  const onStartRace = (): void => {
    dispatch(startRace(cars))
      .catch(() => null);
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <button type="button" disabled={raceRunning || cars.length === 0} onClick={onStartRace}>
        Race
      </button>
      <button
        type="button"
        onClick={() => {
          cars.forEach((car) => {
            dispatch(stopCar(car.id)).catch(() => null);
          });
          dispatch(resetCarsState(cars.map((car) => car.id)));
        }}
      >
        Reset
      </button>
      {winnerMessage ? <p>{winnerMessage}</p> : null}
    </div>
  );
}

function GaragePagination(): JSX.Element {
  const dispatch = useAppDispatch();
  const page = useAppSelector((s) => s.ui.garagePage);
  const totalCount = useAppSelector((s) => s.garage.totalCount);
  const raceRunning = useAppSelector((s) => s.race.raceRunning);
  const totalPages = Math.max(1, Math.ceil(totalCount / GARAGE_PAGE_SIZE));

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <button type="button" disabled={page <= 1 || raceRunning} onClick={() => dispatch(setGaragePage(page - 1))}>Prev</button>
      <span>Page {page} / {totalPages}</span>
      <button type="button" disabled={page >= totalPages || raceRunning} onClick={() => dispatch(setGaragePage(page + 1))}>Next</button>
    </div>
  );
}

function GaragePage(): JSX.Element {
  useGarageLoader();
  const totalCount = useAppSelector((s) => s.garage.totalCount);

  return (
    <section>
      <h1>Garage ({totalCount})</h1>
      <GarageForms />
      <RaceControls />
      <GarageList />
      <GaragePagination />
    </section>
  );
}

export default GaragePage;
