import { useMemo, useState, useEffect } from "react";
import {
  ReactFlow,
  useNodesState,
  Background,
  Controls,
  Handle,
  Position,
  MarkerType,
  BaseEdge,
  getBezierPath,
  type NodeProps,
  type Node,
  type EdgeProps,
} from "@xyflow/react";
import {
  Coffee,
  Utensils,
  Users,
  CheckCircle2,
  ShoppingBag,
  UserRound,
  GitBranch,
} from "lucide-react";
import type { Scenario, Station, Run } from "../types/model";
import { useEditor } from "../stores/editor";
import { playbackState } from "../simulation/playback";
import { clock, duration, percent } from "../utils/format";
import "@xyflow/react/dist/style.css";
type StationData = {
  station: Station;
  queue: string[];
  busy: string[];
  processed: number;
  utilization: number;
  bottleneck: boolean;
  running: boolean;
  onCustomer: (id: string) => void;
};
function StationNode({ data, selected }: NodeProps<Node<StationData>>) {
  const { station: n, queue, busy, running } = data;
  const Icon =
    n.kind === "entry"
      ? Users
      : n.kind === "exit"
        ? CheckCircle2
        : n.id === "drinks"
          ? Coffee
          : n.id === "food"
            ? Utensils
            : n.id === "pickup"
              ? ShoppingBag
              : GitBranch;
  return (
    <div
      className={`station-node ${n.kind} ${selected ? "selected" : ""} ${data.bottleneck ? "bottleneck" : ""}`}
    >
      {n.kind !== "entry" && <Handle type="target" position={Position.Left} />}
      <div className="station-title">
        <span className="station-symbol">
          <Icon size={18} />
        </span>
        <strong>{n.name}</strong>
        {n.kind === "station" && (
          <span className={`node-state ${data.bottleneck ? "danger" : ""}`}>
            {data.bottleneck ? "BOTTLENECK" : busy.length ? "BUSY" : "READY"}
          </span>
        )}
      </div>
      {n.kind === "station" ? (
        <>
          <div className="station-row">
            <span>
              <UserRound size={13} />
              Workers
            </span>
            <b>
              {running ? `${busy.length} / ${n.workers}` : n.workers}
              {running ? " busy" : ""}
            </b>
          </div>
          <div className="station-row">
            <span>{running ? "Queue" : "Service"}</span>
            <b>
              {running
                ? `${queue.length} orders`
                : duration(n.service.mean) + " avg"}
            </b>
          </div>
          {running && (
            <>
              <div className="util-bar">
                <i
                  style={{ width: `${Math.min(100, data.utilization * 100)}%` }}
                />
              </div>
              <div className="station-row tiny">
                <span>Utilization</span>
                <span>{percent(data.utilization)}</span>
              </div>
            </>
          )}
          <div className="queue-tokens">
            {queue.slice(0, 6).map((id) => (
              <button
                className="nodrag nopan queue-token"
                key={id}
                aria-label={`Inspect customer ${id}`}
                title={`Customer ${id}`}
                onClick={() => data.onCustomer(id)}
              />
            ))}
            {queue.length > 6 && <span>+{queue.length - 6}</span>}
          </div>
          {busy.length > 0 && (
            <div className="active-tokens">
              {busy.slice(0, 4).map((id) => (
                <button
                  className="nodrag nopan active-token"
                  key={id}
                  onClick={() => data.onCustomer(id)}
                  title={`Serving ${id}`}
                  aria-label={`Inspect customer ${id}`}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        <small>
          {n.kind === "entry" ? "Arrival stream" : "Orders finished"}
        </small>
      )}
      {n.kind !== "exit" && <Handle type="source" position={Position.Right} />}
    </div>
  );
}
function FlowEdge(props: EdgeProps) {
  const [path] = getBezierPath(props);
  const active = !!props.data?.active;
  return (
    <>
      <BaseEdge
        path={path}
        markerEnd={props.markerEnd}
        style={{ stroke: active ? "#3157e8" : "#b7bec8", strokeWidth: 1.8 }}
      />
      {active && (
        <circle r="4" fill="#3157e8">
          <animateMotion dur="1s" repeatCount="indefinite" path={path} />
        </circle>
      )}
    </>
  );
}
const nodeTypes = { station: StationNode },
  edgeTypes = { flow: FlowEdge };
export function WorkflowCanvas({
  scenario,
  run,
  time,
  selected,
  onSelect,
  onCustomer,
}: {
  scenario: Scenario;
  run: Run | null;
  time: number;
  selected: string | null;
  onSelect: (id: string | null) => void;
  onCustomer: (id: string) => void;
}) {
  const edit = useEditor((s) => s.edit);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<StationData>>([]);
  const [selectedEdges, setSelectedEdges] = useState<string[]>([]);
  const state = useMemo(
    () => (run ? playbackState(run, time) : null),
    [run, time],
  );
  useEffect(() => {
    setNodes((prev) =>
      scenario.stations.map((n) => ({
        ...prev.find((node) => node.id === n.id),
        id: n.id,
        type: "station",
        position: n.position,
        selected: selected === n.id,
        data: {
          station: n,
          queue: state?.stations[n.id]?.queue ?? [],
          busy: state?.stations[n.id]?.busy ?? [],
          processed: state?.stations[n.id]?.processed ?? 0,
          utilization: state?.stations[n.id]?.utilization ?? 0,
          bottleneck:
            time === run?.summary.duration
              ? run?.bottleneck === n.id
              : state?.bottleneck === n.id,
          running: !!run,
          onCustomer,
        },
      })),
    );
  }, [scenario, state, time, run, selected, onCustomer, setNodes]);
  return (
    <div className="workflow-canvas">
      <ReactFlow
        nodes={nodes}
        edges={scenario.links.map((e) => ({
          ...e,
          type: "flow",
          selected: selectedEdges.includes(e.id),
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 16,
            height: 16,
            color: "#b7bec8",
          },
          data: {
            active:
              !!run &&
              run.customers.some((c) => {
                const source = c.visits.find((v) => v.stationId === e.source);
                const target = c.visits.find((v) => v.stationId === e.target);
                const sourceKind = scenario.stations.find(
                  (n) => n.id === e.source,
                )?.kind;
                const targetKind = scenario.stations.find(
                  (n) => n.id === e.target,
                )?.kind;
                const transfer =
                  targetKind === "exit" ? c.completed : target?.queued;
                return (
                  transfer !== undefined &&
                  transfer <= time &&
                  transfer > time - 12 &&
                  (sourceKind === "entry" || source?.end !== undefined)
                );
              }),
          },
        }))}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onNodesDelete={(deleted) =>
          edit((s) => {
            const ids = new Set(deleted.map((n) => n.id));
            s.stations = s.stations.filter((n) => !ids.has(n.id));
            s.links = s.links.filter(
              (e) => !ids.has(e.source) && !ids.has(e.target),
            );
            s.orderTypes.forEach((t) => {
              t.stations = t.stations.filter((id) => !ids.has(id));
            });
          })
        }
        onEdgesChange={(changes) =>
          setSelectedEdges((prev) => {
            let next = [...prev];
            for (const change of changes)
              if (change.type === "select")
                next = change.selected
                  ? [...new Set([...next, change.id])]
                  : next.filter((id) => id !== change.id);
            return next;
          })
        }
        onNodeClick={(_, n) => onSelect(n.id)}
        onPaneClick={() => onSelect(null)}
        onNodeDragStop={(_, n) => {
          edit((s) => {
            const st = s.stations.find((st) => st.id === n.id);
            if (st) st.position = n.position;
          });
        }}
        onConnect={(connection) => {
          if (connection.source === connection.target) return;
          edit((s) => {
            if (
              !s.links.some(
                (e) =>
                  e.source === connection.source &&
                  e.target === connection.target,
              )
            )
              s.links.push({ ...connection, id: crypto.randomUUID() });
          });
        }}
        onEdgesDelete={(edges) =>
          edit((s) => {
            s.links = s.links.filter((e) => !edges.some((d) => d.id === e.id));
          })
        }
        fitView
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.2}
        maxZoom={1.8}
        deleteKeyCode={["Backspace", "Delete"]}
      >
        <Background gap={20} size={1} color="#DDE1E7" />
        <Controls showInteractive={false} />
      </ReactFlow>
      <div className="canvas-status">
        <span className="eyebrow">{scenario.name.toUpperCase()}</span>
        <strong>
          {run
            ? `${state?.arrived} / ${run.summary.arrivals} customers`
            : "Build. Connect. Experiment."}
        </strong>
        <span>{run ? clock(time) : "Drag a handle to connect stations"}</span>
      </div>
      <div className="canvas-legend">
        <span>
          <i className="legend-dot" />
          Customer
        </span>
        <span>
          <i className="legend-dot amber" />
          Queued
        </span>
        <span>FIFO · parallel tasks</span>
      </div>
    </div>
  );
}
