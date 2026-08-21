const memory = new Map<string, string>();

const localStorageShim: Storage = {
  get length() { return memory.size; },
  clear() { memory.clear(); },
  getItem(key: string) { return memory.get(key) ?? null; },
  key(index: number) { return [...memory.keys()][index] ?? null; },
  removeItem(key: string) { memory.delete(key); },
  setItem(key: string, value: string) { memory.set(key, String(value)); },
};

if (typeof window !== "undefined") {
  let hasStorage = false;
  try {
    hasStorage = Boolean(window.localStorage);
  } catch {
    hasStorage = false;
  }
  if (!hasStorage) {
    Object.defineProperty(window, "localStorage", { configurable: true, value: localStorageShim });
  }
}
