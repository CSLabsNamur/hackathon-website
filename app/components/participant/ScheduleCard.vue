<script setup lang="ts">

</script>

<template>
  <UCard>
    <div class="grid gap-3 place-items-center justify-items-center">
      <UIcon name="i-lucide-calendar" class="text-6xl"/>
      <div class="grid gap-1.5 text-center">
        <p class="font-semibold text-lg">Évènement à venir</p>
        <p v-if="nextSpecialEvent" class="text-highlighted">
          <span class="font-semibold">{{ nextSpecialEvent.title }}</span>,
          {{ $dayjs(nextSpecialEvent.exactDateTime[0]).format('[à] H[h]mm') }}
        </p>
        <p v-else class="text-muted">
          Aucun évènement spécial à venir pour le moment. Amusez-vous bien !
        </p>
      </div>
    </div>
  </UCard>
</template>
