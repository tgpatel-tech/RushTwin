export type Distribution = {
  kind: "fixed" | "uniform" | "normal" | "triangular";
  mean: number;
  variation: number;
};
export type Station = {
  id: string;
  name: string;
  kind: "entry" | "station" | "exit";
  workers: number;
  service: Distribution;
  position: { x: number; y: number };
};
export type Link = { id: string; source: string; target: string };
export type OrderType = {
  id: string;
  name: string;
  weight: number;
  stations: string[];
};
export type DemandSettings = {
  mode: "generated" | "schedule" | "imported";
  duration: number;
  rate: number;
  seed: number;
  intervals: { start: number; end: number; rate: number }[];
};
export type Arrival = { id: string; time: number; type: string };
export type RunDemand = { seed: number; duration: number; arrivals: Arrival[] };
export type Scenario = {
  id: string;
  name: string;
  stations: Station[];
  links: Link[];
  orderTypes: OrderType[];
  demand: DemandSettings;
  replay?: RunDemand;
};
export type Project = {
  schemaVersion: 1;
  id: string;
  name: string;
  updatedAt: number;
  scenarios: Scenario[];
  activeScenarioId: string;
};
export type Visit = {
  stationId: string;
  queued: number;
  start?: number;
  end?: number;
  duration?: number;
};
export type CustomerResult = Arrival & {
  visits: Visit[];
  completed?: number;
  wait: number;
  service: number;
  total: number;
};
export type EventType =
  | "CUSTOMER_ARRIVAL"
  | "TASK_READY"
  | "QUEUE_ENTER"
  | "SERVICE_START"
  | "SERVICE_COMPLETE"
  | "TASK_COMPLETE"
  | "CUSTOMER_COMPLETE";
export type SimEvent = {
  time: number;
  sequence: number;
  type: EventType;
  customerId: string;
  stationId?: string;
};
export type StationResult = {
  id: string;
  name: string;
  workers: number;
  processed: number;
  utilization: number;
  avgQueue: number;
  maxQueue: number;
  avgWait: number;
  medianWait: number;
  p90Wait: number;
  busyTime: number;
  totalWait: number;
  waitShare: number;
};
export type Summary = {
  arrivals: number;
  completed: number;
  unfinished: number;
  duration: number;
  throughput: number;
  avgWait: number;
  medianWait: number;
  p90Wait: number;
  maxWait: number;
  avgService: number;
  avgTotal: number;
  maxQueue: number;
};
export type Run = {
  id: string;
  projectId: string;
  scenarioId: string;
  scenario: Scenario;
  createdAt: number;
  seed: number;
  demand: RunDemand;
  customers: CustomerResult[];
  stations: StationResult[];
  events: SimEvent[];
  summary: Summary;
  bottleneck?: string;
};
