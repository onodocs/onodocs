import { bootstrapApplication } from "@angular/platform-browser";
import { Component, ElementRef, DestroyRef, afterNextRender, inject, input, signal, viewChild } from "@angular/core";
import { mountDocument } from "../../sdk/mount";

@Component({ selector: "document-viewer", template: `<button type="button" (click)="cancel()">Cancel loading</button><output role="status">{{ status() }}</output><div class="viewport"><div #host class="pages"></div></div>` })
class DocumentViewer {
  source = input.required<string | File>();
  host = viewChild.required<ElementRef<HTMLElement>>("host");
  status = signal("Opening document…");
  private _stop = () => {};
  constructor() {
    const destroy = inject(DestroyRef);
    afterNextRender(() => {
      this._stop = mountDocument(this.host().nativeElement, this.source(), error => this.status.set(String(error)), value => this.status.set(value));
    });
    destroy.onDestroy(() => this._stop());
  }
  cancel() { this._stop(); this.status.set("Loading cancelled. Open another document to continue."); }
}

@Component({ selector: "app-root", imports: [DocumentViewer], template: `
  <main><h1>Word document viewer</h1>
  <p>Open a local Word file or the included sample. Selected files stay in your browser.</p>
  <a href="https://github.com/onodocs/onodocs/tree/main/examples/frameworks/angular">Source on GitHub</a>
  <div class="toolbar">
    <label>Open Word file <input type="file" accept=".docx,.docm,.dotx,.dotm" (change)="choose($event)"></label>
    <button type="button" (click)="open('/sample.docx')">Open sample</button>
    <button type="button" (click)="visible.set(!visible())">{{ visible() ? 'Hide viewer' : 'Show viewer' }}</button>
  </div>
  @if (visible()) { @for (entry of documents(); track entry) { <document-viewer [source]="entry.source" /> } }
  </main>` })
class App {
  visible = signal(true);
  documents = signal([{ source: "/sample.docx" as string | File }]);
  open(source: string | File) { this.documents.set([{ source }]); this.visible.set(true); }
  choose(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = "";
    if (file) this.open(file);
  }
}
bootstrapApplication(App).catch(console.error);
