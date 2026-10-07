<script lang="ts">
  import Viewer from "./Viewer.svelte";
  let source = $state<string | File>("/sample.docx");
  let visible = $state(true);
  let revision = $state(0);
  function open(value: string | File) { source = value; revision++; visible = true; }
  function choose(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = "";
    if (file) open(file);
  }
</script>
<main>
  <h1>Word document viewer</h1>
  <p>Open a local Word file or the included sample. Selected files stay in your browser.</p>
  <a href="https://github.com/onodocs/onodocs/tree/main/examples/frameworks">Source on GitHub</a>
  <div class="toolbar">
    <label>Open Word file <input type="file" accept=".docx,.docm,.dotx,.dotm" onchange={choose}></label>
    <button type="button" onclick={() => open('/sample.docx')}>Open sample</button>
    <button type="button" onclick={() => visible = !visible}>{visible ? "Hide viewer" : "Show viewer"}</button>
  </div>
  {#if visible}{#key revision}<Viewer {source} />{/key}{/if}
</main>
