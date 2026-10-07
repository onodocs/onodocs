import { mountDocument } from "../sdk/mount";

export function mount(host: HTMLElement) {
  const pages = host.querySelector<HTMLElement>(".pages")!;
  const status = host.querySelector<HTMLOutputElement>("output")!;
  const events = new AbortController();
  const options = { signal: events.signal };
  let stop = () => {};
  function open(source: string | File) {
    stop();
    stop = mountDocument(pages, source, error => { status.textContent = String(error); }, value => { status.textContent = value; });
  }
  host.querySelector<HTMLInputElement>('input[type="file"]')!.addEventListener("change", event => {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = "";
    if (file) open(file);
  }, options);
  host.querySelector("[data-open]")!.addEventListener("click", () => open("/sample.docx"), options);
  host.querySelector("[data-cancel]")!.addEventListener("click", () => { stop(); status.textContent = "Loading cancelled. Open another document to continue."; }, options);
  const observer = new MutationObserver(() => { if (!host.isConnected) dispose(); });
  observer.observe(document.body, { childList: true, subtree: true });
  function dispose() { stop(); events.abort(); observer.disconnect(); }
  window.addEventListener("pagehide", event => { if (!event.persisted) dispose(); }, options);
  open("/sample.docx");
}
