<script setup lang="ts">
defineProps<{ title: string; }>();
</script>

<template>
  <UDashboardNavbar :title>
    <template #leading>
      <UDashboardSidebarCollapse/>
    </template>
    <template #right>
      <UColorModeButton/>
      <USeparator v-if="$slots.right" orientation="vertical" class="h-(--ui-header-height) py-5"/>
      <slot name="right"/>
    </template>
  </UDashboardNavbar>
</template>
