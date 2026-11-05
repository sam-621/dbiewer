import { onTestFinished, vi } from 'vitest';

export const VIEWPORT = { width: 288, height: 100 };

export const createMouseEvent = (type: string, clientX: number, clientY: number) => {
  const event = new MouseEvent(type, { bubbles: true, clientX, clientY });
  Object.defineProperty(event, 'view', { value: window });

  return event;
};

export const measureNodes = () => {
  class MeasuringResizeObserver {
    constructor(private readonly callback: (entries: { target: Element }[]) => void) {}
    observe(target: Element) {
      this.callback([{ target }]);
    }
    unobserve() {}
    disconnect() {}
  }

  vi.stubGlobal('ResizeObserver', MeasuringResizeObserver);
  const width = vi
    .spyOn(HTMLElement.prototype, 'offsetWidth', 'get')
    .mockReturnValue(VIEWPORT.width);
  const height = vi
    .spyOn(HTMLElement.prototype, 'offsetHeight', 'get')
    .mockReturnValue(VIEWPORT.height);
  const clientWidth = vi
    .spyOn(Element.prototype, 'clientWidth', 'get')
    .mockReturnValue(VIEWPORT.width);
  const clientHeight = vi
    .spyOn(Element.prototype, 'clientHeight', 'get')
    .mockReturnValue(VIEWPORT.height);

  onTestFinished(() => {
    vi.unstubAllGlobals();
    width.mockRestore();
    height.mockRestore();
    clientWidth.mockRestore();
    clientHeight.mockRestore();
  });
};
