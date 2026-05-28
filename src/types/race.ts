export type EngineStatus = 'started' | 'stopped' | 'drive';

export type EngineResponse = {
  velocity: number;
  distance: number;
};

export type DriveResponse = {
  success: boolean;
};

export type CarRaceState = {
  status: 'idle' | 'starting' | 'driving' | 'stopping' | 'finished' | 'broken';
  durationMs: number;
  progress: number;
  runId: number;
};
