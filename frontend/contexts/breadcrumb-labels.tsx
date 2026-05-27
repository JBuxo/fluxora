"use client";

import { createContext, useCallback, useContext, useState } from "react";

interface BreadcrumbLabelsCtx {
  getLabel: (segment: string) => string | undefined;
  setLabel: (segment: string, label: string) => void;
  clearLabel: (segment: string) => void;
}

const Ctx = createContext<BreadcrumbLabelsCtx>({
  getLabel: () => undefined,
  setLabel: () => {},
  clearLabel: () => {},
});

export function BreadcrumbLabelsProvider({ children }: { children: React.ReactNode }) {
  const [labels, setLabels] = useState<Record<string, string>>({});

  const getLabel = useCallback((s: string) => labels[s], [labels]);
  const setLabel = useCallback((s: string, l: string) => setLabels((prev) => ({ ...prev, [s]: l })), []);
  const clearLabel = useCallback((s: string) => setLabels((prev) => { const n = { ...prev }; delete n[s]; return n; }), []);

  return <Ctx.Provider value={{ getLabel, setLabel, clearLabel }}>{children}</Ctx.Provider>;
}

export const useBreadcrumbLabels = () => useContext(Ctx);
