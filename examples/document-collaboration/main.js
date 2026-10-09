import { openCollaborativeEditor, createCollaborationRecovery, createCollaborationTransport } from "@onodocs/editor/collaboration";

const user = new URL(location.href).searchParams.get("user") ?? "alex";
const sessionKey = "collaboration-tab";
if (!sessionStorage.getItem(sessionKey)) sessionStorage.setItem(sessionKey, crypto.randomUUID());
export const application = await openCollaborativeEditor({ container: document.querySelector("main"), exchange: createCollaborationTransport("/collaboration"), recovery: createCollaborationRecovery(`brief:${user}:${sessionStorage.getItem(sessionKey)}`) });
document.querySelector("#retry").onclick = () => application.sync();
