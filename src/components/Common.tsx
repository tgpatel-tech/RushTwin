import { useEffect, useRef, type ReactNode } from "react";
import { X, ArrowRight, Coffee, Utensils, Check, Users } from "lucide-react";
export function Logo() {
  return (
    <span className="logo" aria-label="RushTwin">
      <svg viewBox="0 0 28 28" fill="none">
        <path
          d="M5 5h10v8H5v10M13 5v10h10v8H13"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog
      aria-label={title}
      ref={ref}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-heading">
        <h2>{title}</h2>
        <button
          className="icon-button"
          aria-label="Close dialog"
          onClick={onClose}
        >
          <X size={18} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function MiniFlow({ large = false }: { large?: boolean }) {
  return (
    <div
      className={`mini-flow ${large ? "large" : ""}`}
      aria-label="Customers enter Order, branch into Drinks and Food, reunite at Pickup and finish"
    >
      <div className="mini-node">
        <Users />
        <span>ORDER</span>
      </div>
      <ArrowRight />
      <div className="mini-branch">
        <div className="mini-node accent">
          <Coffee />
          <span>DRINKS</span>
          <i className="mini-dots">•••••</i>
        </div>
        <div className="mini-node">
          <Utensils />
          <span>FOOD</span>
        </div>
      </div>
      <ArrowRight />
      <div className="mini-node">
        <Check />
        <span>PICKUP</span>
      </div>
    </div>
  );
}
export function Empty({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="empty">
      <h2>{title}</h2>
      {children}
    </div>
  );
}
export function Metric({
  label,
  value,
  note,
}: {
  label: string;
  value: ReactNode;
  note?: string;
}) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
      {note && <small>{note}</small>}
    </div>
  );
}
