export type DiagramView = {
  jumpedId: string | null;
  trailCurrentId: string | null;
  trailBackName: string | null;
};

const EMPTY_VIEW: DiagramView = { jumpedId: null, trailCurrentId: null, trailBackName: null };

export const createDiagramViewStore = (initial: Partial<DiagramView> = {}) => {
  let view = { ...EMPTY_VIEW, ...initial };
  const listeners = new Set<() => void>();

  return {
    getView: () => view,
    changeView: (change: Partial<DiagramView>) => {
      view = { ...view, ...change };
      listeners.forEach(listener => listener());
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener);

      return () => listeners.delete(listener);
    }
  };
};
