const chat = new URLSearchParams(location.search).get("chat");
const status = document.querySelector("#status");
let previous;
function content(parent, value) {
  if (Array.isArray(value)) { for (const item of value) content(parent, item); return; }
  if (value?.type === "input_image" && /^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(value.image_url)) { const image = document.createElement("img"); image.src = value.image_url; image.alt = "Document page supplied to the model"; parent.append(image); return; }
  const pre = document.createElement("pre");
  pre.textContent = typeof value === "string" ? value : value?.text ?? JSON.stringify(value, null, 2); parent.append(pre);
}
async function refresh() {
  try {
    const response = await fetch(`/api/transcript?chat=${encodeURIComponent(chat ?? "")}`, { cache: "no-store" });
    const data = await response.json(); if (!response.ok) throw new Error(data.error);
    status.textContent = data.status + (data.error ? `: ${data.error}` : "");
    const serialized = JSON.stringify(data); if (serialized === previous) return; previous = serialized;
    document.querySelector("#instructions").textContent = data.instructions;
    const usage = document.querySelector("#usage"); usage.replaceChildren();
    if (data.usage) {
      const table = document.createElement("table");
      for (const row of [["Scope", "Input", "Cached input", "Output", "Total"], ...["turn", "conversation"].map(scope => [scope === "turn" ? "Latest turn" : "Conversation", ...["inputTokens", "cachedTokens", "outputTokens", "totalTokens"].map(key => data.usage[scope][key].toLocaleString())])]) {
        const tr = table.insertRow(); for (const value of row) tr.insertCell().textContent = value;
      }
      usage.append(table);
      const details = document.createElement("details"), summary = document.createElement("summary"); summary.textContent = "Per-response usage"; details.append(summary); content(details, data.usage.responses); usage.append(details);
    } else usage.textContent = "No usage recorded yet.";
    const transcript = document.querySelector("#transcript"); transcript.replaceChildren();
    for (const [index, item] of data.input.entries()) {
      if (item.type === "reasoning") continue;
      const article = document.createElement("article"), title = document.createElement("strong");
      title.textContent = `${index + 1}. ${item.role ?? item.type ?? "Event"}${item.name ? ` · ${item.name}` : ""}${item.call_id ? ` · ${item.call_id}` : ""}`; article.append(title);
      content(article, item.content ?? item.output ?? item); transcript.append(article);
    }
  } catch (error) { status.textContent = error.message; }
}
document.querySelector("#refresh").addEventListener("click", refresh);
await refresh();
setInterval(() => { if (!document.hidden) void refresh(); }, 3000);
