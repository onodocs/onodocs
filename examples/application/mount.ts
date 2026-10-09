import type { ApplicationEditor, ApplicationOptions } from "@onodocs/sdk/application";

export function mountEditor(container: HTMLElement, options: Omit<ApplicationOptions, "container" | "signal">, onReady: (application: ApplicationEditor) => void = () => {}) {
  const lifetime = new AbortController();
  let application: ApplicationEditor | undefined;
  void import("@onodocs/sdk/application").then(async ({ openApplicationEditor }) => {
    lifetime.signal.throwIfAborted();
    application = await openApplicationEditor({ ...options, container, signal: lifetime.signal });
    if (lifetime.signal.aborted) application.dispose();
    else onReady(application);
  }).catch(error => { if (!lifetime.signal.aborted) options.onEvent?.({ type: "error", error, state: { dirty: false, saving: false, revision: 0 } }); });
  return () => { lifetime.abort(); application?.dispose(); };
}
