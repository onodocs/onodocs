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
  <div class="toolbar">
    <label>Open Word file <input type="file" accept=".docx,.docm,.dotx,.dotm" (change)="choose($event)"></label>
    <button type="button" (click)="open('/sample.docx')">Open sample</button>
    <button type="button" (click)="visible.set(!visible())">{{ visible() ? 'Hide viewer' : 'Show viewer' }}</button>
  <a class="demo-source" href="https://github.com/onodocs/onodocs/tree/main/examples/frameworks/angular" target="_blank" rel="noopener noreferrer" aria-label="View source on GitHub" title="View source on GitHub"><svg aria-hidden="true" focusable="false" width="18" height="18" viewBox="0 0 16 16"><path d="M6.766 11.328c-2.063-.25-3.516-1.734-3.516-3.656 0-.781.281-1.625.75-2.188-.203-.515-.172-1.609.063-2.062.625-.078 1.468.25 1.968.703.594-.187 1.219-.281 1.985-.281.765 0 1.39.094 1.953.265.484-.437 1.344-.765 1.969-.687.218.422.25 1.515.046 2.047.5.593.766 1.39.766 2.203 0 1.922-1.453 3.375-3.547 3.64.531.344.89 1.094.89 1.954v1.625c0 .468.391.734.86.547C13.781 14.359 16 11.53 16 8.03 16 3.61 12.406 0 7.984 0 3.563 0 0 3.61 0 8.031a7.88 7.88 0 0 0 5.172 7.422c.422.156.828-.125.828-.547v-1.25c-.219.094-.5.156-.75.156-1.031 0-1.64-.562-2.078-1.609-.172-.422-.36-.672-.719-.719-.187-.015-.25-.093-.25-.187 0-.188.313-.328.625-.328.453 0 .844.281 1.25.86.313.452.64.655 1.031.655s.641-.14 1-.5c.266-.265.47-.5.657-.656"/></svg></a></div>
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
