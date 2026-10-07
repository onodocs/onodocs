<script setup lang="ts">
import { ref, shallowRef } from "vue";
import Viewer from "./Viewer.vue";
const source = shallowRef<string | File>("/sample.docx");
const visible = ref(true);
const revision = ref(0);
function open(value: string | File) { source.value = value; revision.value++; visible.value = true; }
function choose(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (file) open(file);
}
</script>
<template>
  <main>
    <h1>Word document viewer</h1>
    <p>Open a local Word file or the included sample. Selected files stay in your browser.</p>
    <a href="https://github.com/onodocs/onodocs/tree/main/examples/frameworks">Source on GitHub</a>
    <div class="toolbar">
      <label>Open Word file <input type="file" accept=".docx,.docm,.dotx,.dotm" @change="choose"></label>
      <button type="button" @click="open('/sample.docx')">Open sample</button>
      <button type="button" @click="visible = !visible">{{ visible ? "Hide viewer" : "Show viewer" }}</button>
    </div>
    <Viewer v-if="visible" :key="revision" :source="source" />
  </main>
</template>
