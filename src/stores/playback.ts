import { create } from "zustand";
import type { Run } from "../types/model";
type State = {
  run: Run | null;
  time: number;
  playing: boolean;
  speed: number;
  tab: string;
  setRun: (r: Run) => void;
  seek: (time: number) => void;
  toggle: () => void;
  setSpeed: (n: number) => void;
  setTab: (tab: string) => void;
  tick: (delta: number) => void;
};
export const usePlayback = create<State>((set, get) => ({
  run: null,
  time: 0,
  playing: false,
  speed: 10,
  tab: "Live",
  setRun: (run) => set({ run, time: 0, playing: true, tab: "Live" }),
  seek: (time) => set({ time, playing: false }),
  toggle: () =>
    set({
      playing: !get().playing,
      speed: get().speed === 0 ? 10 : get().speed,
    }),
  setSpeed: (speed) => {
    set({ speed });
    if (speed === 0 && get().run)
      set({
        time: get().run!.summary.duration,
        playing: false,
        tab: "Results",
      });
  },
  setTab: (tab) => set({ tab }),
  tick: (delta) => {
    const s = get();
    if (!s.run || !s.playing) return;
    const time = Math.min(s.run.summary.duration, s.time + delta * s.speed * 6);
    set({
      time,
      playing: time < s.run.summary.duration,
      tab: time >= s.run.summary.duration ? "Results" : s.tab,
    });
  },
}));
