<script setup lang="ts">
defineProps<{ title: string; }>();
</script>

<template>
  <UDashboardNavbar :title>
    <template #leading>
      <UDashboardSidebarCollapse/>
    </template>
    <template #right>
      <slot name="right"/>
      <USeparator v-if="$slots.right" orientation="vertical" class="h-(--ui-header-height) py-5"/>
      <UColorModeButton/>
    </template>
  </UDashboardNavbar>
</template>
