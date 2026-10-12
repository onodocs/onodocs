<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import { mountEditor } from "./mount.js";

const props = defineProps({ options: { type: Object, required: true } });
const emit = defineEmits(["ready"]);
const host = ref(null);
let stop;
onMounted(() => { stop = mountEditor(host.value, props.options, application => emit("ready", application)); });
onBeforeUnmount(() => stop?.());
</script>

<template><div ref="host" /></template>
