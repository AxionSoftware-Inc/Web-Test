import type { CoreEvent, CoreEventListener, CoreModuleId } from "./types";

class CoreEventBusInstance {
  private listeners: Map<string, Set<CoreEventListener>> = new Map();

  emit<T = unknown>(type: string, payload: T, moduleId: CoreModuleId | "core" = "core"): void {
    const event: CoreEvent<T> = {
      type,
      moduleId,
      payload,
      timestamp: Date.now(),
    };

    const targetSet = this.listeners.get(type);
    if (targetSet) {
      targetSet.forEach((listener) => {
        try {
          listener(event);
        } catch (err) {
          console.error(`[CoreEventBus] Error in listener for "${type}":`, err);
        }
      });
    }

    // "*" wildcard listenerlar
    const allSet = this.listeners.get("*");
    if (allSet) {
      allSet.forEach((listener) => {
        try {
          listener(event);
        } catch (err) {
          console.error(`[CoreEventBus] Error in wildcard listener:`, err);
        }
      });
    }
  }

  on<T = unknown>(type: string, listener: CoreEventListener<T>): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    const set = this.listeners.get(type)!;
    set.add(listener as CoreEventListener);

    return () => this.off(type, listener as CoreEventListener);
  }

  off(type: string, listener: CoreEventListener): void {
    const set = this.listeners.get(type);
    if (set) {
      set.delete(listener);
      if (set.size === 0) {
        this.listeners.delete(type);
      }
    }
  }

  clear(): void {
    this.listeners.clear();
  }
}

export const coreEventBus = new CoreEventBusInstance();
