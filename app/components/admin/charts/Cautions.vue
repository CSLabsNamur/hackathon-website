<script setup lang="ts">
const props = defineProps<{
  breakdown: ReturnType<typeof getCautionBreakdown>;
  total: number;
}>();

const slices = computed(() => props.breakdown.filter(item => item.count > 0));
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between gap-3">
        <h2 class="font-semibold text-highlighted">Suivi des cautions</h2>
        <UButton to="/admin/participants" label="Participants" color="neutral" variant="link"
                 trailing-icon="i-lucide-arrow-up-right" size="sm"/>
      </div>
    </template>

    <template v-if="total">
      <UChart type="donut" :data="slices" index="label" :categories="['count']"
              :colors="slices.map(item => item.color)" :height="220" :legend="false"
              aria-label="Répartition des participants par statut de caution">
        <template #center>
          <p class="text-3xl font-semibold text-highlighted tabular-nums">{{ total }}</p>
          <p class="text-xs text-muted">participants</p>
        </template>
      </UChart>
      <dl class="mt-4 grid grid-cols-2 gap-x-6 gap-y-3">
        <div v-for="item in breakdown" :key="item.status" class="flex items-center gap-2">
          <UBadge :color="item.color" variant="solid" size="xs"
                  class="size-2 shrink-0 rounded-full p-0"/>
          <dt class="text-sm text-muted">{{ item.label }}</dt>
          <dd class="ms-auto text-sm font-semibold text-highlighted tabular-nums">
            {{ item.count }}
          </dd>
        </div>
      </dl>
    </template>
    <UEmpty v-else icon="i-lucide-wallet" title="Aucune caution à suivre"
            description="Le suivi sera disponible dès les premières inscriptions."
            class="min-h-60"/>
  </UCard>
</template>
