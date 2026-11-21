<script setup lang="ts">
defineProps<{ checkedInAt: CurrentParticipant["checkedInAt"] }>();

const {data: eventPhase} = await useEventPhase();
const arrivalAlert = computed(() => getParticipantArrivalAlert(eventPhase.value));
</script>

<template>
  <UCard v-if="checkedInAt || arrivalAlert">
    <template #header>
      <h2 class="text-lg font-semibold text-highlighted">
        {{ checkedInAt ? "Arrivée enregistrée" : "Arrivée" }}
      </h2>
    </template>

    <time v-if="checkedInAt" :datetime="checkedInAt" class="text-sm text-muted">
      {{ formatDate(checkedInAt, 'D MMMM [à] HH[h]mm') }}
    </time>
    <UAlert v-else-if="arrivalAlert" v-bind="arrivalAlert" variant="soft" icon="i-lucide-alert-circle"/>
  </UCard>
</template>
