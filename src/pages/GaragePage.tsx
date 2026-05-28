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
import CarIcon from '../components/CarIcon';
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
    <form onSubmit={props.onSubmit} className="car-form">
      <input value={props.name} onChange={(e: ChangeEvent<HTMLInputElement>) => props.onName(e.target.value)} placeholder="Car name" disabled={props.disabled} />
      <input type="color" value={props.color} onChange={(e: ChangeEvent<HTMLInputElement>) => props.onColor(e.target.value)} disabled={props.disabled} />
      <button type="submit" disabled={props.disabled}>Create</button>
    </form>
  );
}

function UpdateForm(props: CarFormProps): JSX.Element {
  return (
    <form onSubmit={props.onSubmit} className="car-form car-form-update">
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
      className="btn-generate"
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

function CarRow(props: {
  car: Car;
  raceRunning: boolean;
  onDelete: () => void;
  onSelect: () => void;
}): JSX.Element {
  const raceState = useAppSelector(
    (s) => s.race.byCarId[props.car.id] ?? { status: 'idle', durationMs: 0, progress: 0, runId: 0 },
  );
  const { onStart, onStop } = useCarRaceActions(props.car);
  const canStart = raceState.status === 'idle' || raceState.status === 'broken';
  const canStop = raceState.status === 'driving' || raceState.status === 'starting';
  const isBroken = raceState.status === 'broken';

  return (
    <article className="car-row">
      <CarRowControls
        canStart={canStart}
        canStop={canStop}
        raceRunning={props.raceRunning}
        onStart={onStart}
        onStop={onStop}
        onSelect={props.onSelect}
        onDelete={props.onDelete}
      />
      <span className="car-name">{props.car.name}</span>
      <CarTrack
        color={props.car.color}
        status={raceState.status}
        durationMs={raceState.durationMs}
        progress={raceState.progress}
      />
      {isBroken ? <small className="engine-broken">Engine broke down</small> : null}
    </article>
  );
}

function useCarRaceActions(car: Car): { onStart: () => void; onStop: () => void } {
  const dispatch = useAppDispatch();
  const onStart = (): void => {
    dispatch(startCar(car))
      .catch(() => null);
  };
  const onStop = (): void => {
    dispatch(stopCar(car.id))
      .catch(() => null);
  };
  return { onStart, onStop };
}

function CarRowControls(props: {
  canStart: boolean;
  canStop: boolean;
  raceRunning: boolean;
  onStart: () => void;
  onStop: () => void;
  onSelect: () => void;
  onDelete: () => void;
}): JSX.Element {
  return (
    <>
      <button type="button" disabled={!props.canStart || props.raceRunning} onClick={props.onStart}>A</button>
      <button type="button" disabled={!props.canStop} onClick={props.onStop}>B</button>
      <button type="button" disabled={props.raceRunning} onClick={props.onSelect}>Select</button>
      <button type="button" disabled={props.raceRunning} onClick={props.onDelete}>Remove</button>
    </>
  );
}

function getCarLeft(progress: number): string {
  const percent = (progress * 100).toFixed(3);
  const pixelOffset = (48 * progress).toFixed(2);
  return `calc(${percent}% - ${pixelOffset}px)`;
}

function CarTrack(props: {
  color: string;
  status: string;
  durationMs: number;
  progress: number;
}): JSX.Element {
  const isDriving = props.status === 'driving';
  const transition = isDriving ? `left ${Math.max(300, props.durationMs)}ms linear` : 'none';
  return (
    <div className="car-track">
      <div
        aria-label="car"
        style={{
          left: getCarLeft(props.progress),
          position: 'absolute',
          top: 0,
          transition,
        }}
      >
        <CarIcon color={props.color} width={52} />
      </div>
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
    <div className="race-controls">
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
      {winnerMessage ? <p className="winner-banner">{winnerMessage}</p> : null}
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
    <div className="pager">
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
    <section className="page-card">
      <h1 className="page-title">Garage ({totalCount})</h1>
      <GarageForms />
      <RaceControls />
      <GarageList />
      <GaragePagination />
    </section>
  );
}

export default GaragePage;
