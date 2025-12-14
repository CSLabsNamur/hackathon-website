<script setup lang="ts">
defineOptions({
  inheritAttrs: false,
});
withDefaults(defineProps<{
  rounded?: boolean;
}>(), {rounded: true});

const {status, data: participants} = await useParticipants({lazy: true});

const dayjs = useDayjs();

const {eventDateEnd} = useRuntimeConfig().public;

const stats = computed(() => {
  console.log("Recomputing participant stats");
  if (!participants.value) {
    return [];
  }

  const allStats = [{
    title: "Utilisateurs inscrits",
    value: participants.value.length,
    icon: "i-lucide-user-check",
  }, {
    title: "Nouvelles inscriptions (7j)",
    value: participants.value.filter(participant => dayjs().diff(dayjs(participant.createdAt), "day") < 7).length,
    icon: "i-lucide-user-plus",
  }, {
    title: "Cautions payées",
    value: `${participants.value.filter(participant => participant.caution === CautionStatus.PAID).length} / ${participants.value.filter(participant => participant.caution !== CautionStatus.REFUNDED && participant.caution !== CautionStatus.WAIVED).length}`,
    icon: "i-lucide-wallet",
    condition: dayjs().isBefore(dayjs(eventDateEnd)),
  }, {
    title: "Cautions remboursées",
    value: `${participants.value.filter(participant => participant.caution === CautionStatus.REFUNDED).length} / ${participants.value.filter(participant => participant.caution !== CautionStatus.WAIVED).length}`,
    icon: "i-lucide-currency-euro",
    condition: dayjs().isAfter(dayjs(eventDateEnd)),
  }];

  return allStats.filter(stat => stat.condition === undefined || stat.condition);
});

const [DefineFallback, UseFallback] = createReusableTemplate();
</script>

<template>
  <DefineFallback>
    <UPageGrid class="gap-4 sm:gap-6 lg:gap-px" v-bind="$attrs">
      <template v-for="n in 3" :key="n">
        <UPageCard variant="subtle"
                   :class="{'first:rounded-l-lg last:rounded-r-lg lg:rounded-none': rounded,
                            'rounded-none': !rounded}"
                   :ui="{container: 'gap-y-1.5', wrapper: 'items-start',
                         leading: 'p-2.5 rounded-full bg-primary/10 ring ring-inset ring-primary/25 flex-col',
                         title: 'font-normal text-muted text-xs uppercase'}">
          <div class="flex items-center">
            <USkeleton class="h-20 w-full rounded-md bg-muted/50"/>
          </div>
        </UPageCard>
      </template>
    </UPageGrid>
  </DefineFallback>

  <ClientOnly>
    <template #fallback>
      <UseFallback/>
    </template>

    <UseFallback v-if="status === 'pending'"/>
    <UPageGrid v-else-if="status === 'success'" class="gap-4 sm:gap-6 lg:gap-px" v-bind="$attrs">
      <template v-for="stat in stats" :key="stat.title">
        <UPageCard :icon="stat.icon"
                   :title="stat.title" variant="subtle"
                   :class="{'first:rounded-l-lg last:rounded-r-lg lg:rounded-none': rounded,
                          'rounded-none': !rounded}"
                   :ui="{container: 'gap-y-1.5', wrapper: 'items-start',
                       leading: 'p-2.5 rounded-full bg-primary/10 ring ring-inset ring-primary/25 flex-col',
                       title: 'font-normal text-muted text-xs uppercase'}">
          <div class="flex items-center">
            <span class="text-2xl font-semibold text-highlighted">
              {{ stat.value }}
            </span>
          </div>
        </UPageCard>
      </template>
    </UPageGrid>
  </ClientOnly>
</template>
