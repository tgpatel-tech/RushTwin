import type { Project, Scenario, Station } from "../types/model";
export const templateNames = [
  "Blank Workflow",
  "Simple Service Line",
  "Café Rush",
  "School Cafeteria",
];
const station = (
  id: string,
  name: string,
  x: number,
  y: number,
  workers = 1,
  mean = 35,
  variation = 12,
  kind: Station["kind"] = "station",
): Station => ({
  id,
  name,
  position: { x, y },
  workers,
  kind,
  service: { kind: "uniform", mean, variation },
});
export function createScenario(template = "Café Rush"): Scenario {
  const cafe = template === "Café Rush",
    blank = template === "Blank Workflow";
  const stations = cafe
    ? [
        station("entry", "Customers", 0, 190, 0, 1, 0, "entry"),
        station("order", "Order", 210, 160, 2),
        station("drinks", "Drinks", 510, 35, 1, 70, 20),
        station("food", "Food", 510, 285, 1, 40, 12),
        station("pickup", "Pickup", 810, 160, 1, 15, 5),
        station("exit", "Complete", 1110, 190, 0, 1, 0, "exit"),
      ]
    : [
        station("entry", "Customers", 0, 140, 0, 1, 0, "entry"),
        ...(blank
          ? []
          : [
              station(
                "service",
                template === "School Cafeteria" ? "Serving" : "Service",
                250,
                110,
                1,
                40,
                10,
              ),
              ...(template === "School Cafeteria"
                ? [station("checkout", "Checkout", 550, 110, 1, 20, 5)]
                : []),
            ]),
        station(
          "exit",
          "Complete",
          template === "School Cafeteria" ? 850 : 550,
          140,
          0,
          1,
          0,
          "exit",
        ),
      ];
  const pairs = cafe
    ? [
        ["entry", "order"],
        ["order", "drinks"],
        ["order", "food"],
        ["drinks", "pickup"],
        ["food", "pickup"],
        ["pickup", "exit"],
      ]
    : blank
      ? []
      : stations.slice(0, -1).map((n, i) => [n.id, stations[i + 1].id]);
  return {
    id: crypto.randomUUID(),
    name: "Baseline",
    stations,
    links: pairs.map(([source, target]) => ({
      id: `${source}-${target}`,
      source,
      target,
    })),
    orderTypes: cafe
      ? [
          {
            id: "drink",
            name: "Drink Only",
            weight: 35,
            stations: ["order", "drinks", "pickup"],
          },
          {
            id: "food",
            name: "Food Only",
            weight: 20,
            stations: ["order", "food", "pickup"],
          },
          {
            id: "both",
            name: "Drink + Food",
            weight: 45,
            stations: ["order", "drinks", "food", "pickup"],
          },
        ]
      : [
          {
            id: "standard",
            name: "Standard",
            weight: 100,
            stations: stations
              .filter((n) => n.kind === "station")
              .map((n) => n.id),
          },
        ],
    demand: {
      mode: cafe ? "schedule" : "generated",
      duration: 3600,
      rate: 60,
      seed: 473829,
      intervals: [
        { start: 0, end: 900, rate: 40 },
        { start: 900, end: 1500, rate: 100 },
        { start: 1500, end: 2700, rate: 210 },
        { start: 2700, end: 3600, rate: 70 },
      ],
    },
  };
}
export function createProject(name: string, template = "Café Rush"): Project {
  const s = createScenario(template);
  return {
    schemaVersion: 1,
    id: crypto.randomUUID(),
    name,
    updatedAt: Date.now(),
    scenarios: [s],
    activeScenarioId: s.id,
  };
}
