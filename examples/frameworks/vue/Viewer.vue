<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from "vue";
import { mountDocument } from "../../sdk/mount";

const props = defineProps<{ source: string | File }>();
const host = ref<HTMLElement>();
const status = ref("Opening document…");
let stop = () => {};
let unwatch: (() => void) | undefined;
onMounted(() => {
  unwatch = watch(() => props.source, source => {
    stop();
    stop = mountDocument(host.value!, source, error => { status.value = String(error); }, value => { status.value = value; });
  }, { immediate: true });
});
onUnmounted(() => { unwatch?.(); stop(); });
function cancel() { stop(); status.value = "Loading cancelled. Open another document to continue."; }
</script>
<template>
  <button type="button" @click="cancel">Cancel loading</button>
  <output role="status">{{ status }}</output>
  <div class="viewport"><div ref="host" class="pages" /></div>
</template>
