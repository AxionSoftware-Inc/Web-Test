const runtimePrefix = "questlab:mastery-runtime:";

export function runtimeTimingKey(sessionId: string | number) {
  return `${runtimePrefix}timing:${sessionId}`;
}

export function runtimeReportKey(sessionId: string | number) {
  return `${runtimePrefix}report:${sessionId}`;
}

export function readRuntimeQuestionTimes(sessionId: string | number) {
  if (typeof window === "undefined") return {} as Record<string, number>;
  try {
    return JSON.parse(window.sessionStorage.getItem(runtimeTimingKey(sessionId)) ?? "{}") as Record<string, number>;
  } catch {
    return {};
  }
}

export function writeRuntimeQuestionTimes(sessionId: string | number, value: Record<string, number>) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(runtimeTimingKey(sessionId), JSON.stringify(value));
}

export function writeRuntimeReport(sessionId: string | number, value: unknown) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(runtimeReportKey(sessionId), JSON.stringify(value));
}

export function readRuntimeReport<T>(sessionId: string | number) {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(window.sessionStorage.getItem(runtimeReportKey(sessionId)) ?? "null") as T | null;
  } catch {
    return null;
  }
}

export function clearRuntimeSession(sessionId: string | number) {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(runtimeTimingKey(sessionId));
}
