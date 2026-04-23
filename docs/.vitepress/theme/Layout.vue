<script setup>
import DefaultTheme from "vitepress/theme";
import { onMounted } from "vue";
import { useRouter } from "vitepress";
import mediumZoom from "medium-zoom";

const { Layout } = DefaultTheme;
const router = useRouter();

const setupMediumZoom = () => {
  mediumZoom("[data-zoomable]", { background: "transparent" });
};

onMounted(setupMediumZoom);
router.onAfterRouteChange = setupMediumZoom;
</script>

<template>
  <Layout />
</template>

<style>
.medium-zoom-overlay {
  z-index: 999;
}
.medium-zoom-image--opened {
  z-index: 1000;
}
</style>