import { Component, ElementRef, EventEmitter, Input, Output, ViewChild, type AfterViewInit, type OnDestroy } from "@angular/core";
import type { ApplicationEditor, ApplicationOptions } from "@onodocs/editor/application";
import { mountEditor } from "./mount.js";

@Component({ selector: "onodocs-editor", standalone: true, template: "<div #host></div>" })
export class EditorComponent implements AfterViewInit, OnDestroy {
  @Input({ required: true }) options!: Omit<ApplicationOptions, "container">;
  @Output() ready = new EventEmitter<ApplicationEditor>();
  @ViewChild("host", { static: true }) host!: ElementRef<HTMLElement>;
  private stop?: () => void;

  ngAfterViewInit() { this.stop = mountEditor(this.host.nativeElement, this.options, application => this.ready.emit(application)); }
  ngOnDestroy() { this.stop?.(); }
}
