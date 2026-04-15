type Listener = (...args: any[]) => void;

export class BaseService {
  protected listeners: Record<string, Listener[]> = {};

  on(event: string, fn: Listener) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(fn);
  }

  off(event: string, fn: Listener) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter((listener) => listener !== fn);
  }

  protected dispatch(event: string, data: any) {
    if (this.listeners[event]) {
      this.listeners[event].forEach((fn) => fn(data));
    }
  }
}
