import { useEffect, useRef } from "react";

export const useClockTick = (enabled: boolean) => {
  const intervalRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    // Ticking sound disabled per user request.
    return;
  }, [enabled]);
};
