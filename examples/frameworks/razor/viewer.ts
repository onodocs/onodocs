import { mount } from "../dom-viewer";
const container = document.querySelector("#viewer")!;
const template = document.querySelector<HTMLTemplateElement>("#viewer-template")!;
const toggle = document.querySelector<HTMLButtonElement>("#toggle")!;
function show() {
  container.append(template.content.cloneNode(true));
  mount(container.firstElementChild as HTMLElement);
  toggle.textContent = "Hide viewer";
}
toggle.addEventListener("click", () => {
  if (container.children.length) { container.replaceChildren(); toggle.textContent = "Show viewer"; }
  else show();
});
show();
