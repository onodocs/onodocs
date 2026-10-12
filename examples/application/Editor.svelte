<script>
  import { onMount } from "svelte";
  import { mountEditor } from "./mount.js";

  let { options, onReady } = $props();
  let host;
  onMount(() => mountEditor(host, options, onReady));
</script>

<div bind:this={host}></div>
