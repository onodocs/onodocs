import { createEditor } from "@onodocs/editor";

export function createWorkflowEditor(container: HTMLElement, submit: (bytes: Uint8Array) => Promise<void>, onError: (error: unknown) => void) {
  return createEditor({
    container,
    fonts: ["Arial", "Georgia", "Times New Roman"],
    allowedModes: ["view", "edit", "review"],
    onError,
    commands: [{
      id: "submitForReview",
      label: "Submit for review",
      modes: ["edit", "review"],
      ribbon: { tab: "Workflow", group: "Application" },
      async execute(editor) { await submit(await editor.save()); }
    }]
  });
}
