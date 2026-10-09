import { demoLicense } from "../sdk/license";
import { mountReport } from "./main.js";

const lifetime = new AbortController();
const container = document.querySelector("#app");
try {
  const report = await mountReport(container, { document: { licenseKey: await demoLicense(lifetime.signal), signal: lifetime.signal } });
  window.addEventListener("pagehide", event => { if (!event.persisted) { lifetime.abort(); report.dispose(); } });
} catch (error) { container.textContent = error.message; }
