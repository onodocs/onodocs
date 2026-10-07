<script lang="ts">
  import { mountDocument } from "../../../../sdk/mount";
  let { source }: { source: string | File } = $props();
  let host: HTMLDivElement;
  let status = $state("Opening document…");
  let stop = () => {};
  $effect(() => {
    stop = mountDocument(host, source, error => { status = String(error); }, value => { status = value; });
    return () => stop();
  });
  function cancel() { stop(); status = "Loading cancelled. Open another document to continue."; }
</script>
<button type="button" onclick={cancel}>Cancel loading</button>
<output role="status">{status}</output>
<div class="viewport"><div bind:this={host} class="pages"></div></div>
