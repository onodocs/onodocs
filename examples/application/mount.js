function mountEditor(container, options, onReady = () => {
}) {
  const lifetime = new AbortController();
  let application;
  void import("@onodocs/editor/application").then(async ({ openApplicationEditor }) => {
    lifetime.signal.throwIfAborted();
    application = await openApplicationEditor({ ...options, container, signal: lifetime.signal });
    if (lifetime.signal.aborted) application.dispose();
    else onReady(application);
  }).catch((error) => {
    if (!lifetime.signal.aborted) options.onEvent?.({ type: "error", error, state: { dirty: false, saving: false, revision: 0 } });
  });
  return () => {
    lifetime.abort();
    application?.dispose();
  };
}
export {
  mountEditor
};
