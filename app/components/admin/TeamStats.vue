<script setup lang="ts">
defineOptions({
  inheritAttrs: false
})
withDefaults(defineProps<{
  rounded?: boolean;
}>(), {rounded: true});

const {status: participantsStatus, data: participants} = await useParticipants({lazy: true});
const {status: teamsStatus, data: teams} = await useTeams({lazy: true});

const dayjs = useDayjs();

const {eventDateEnd} = useRuntimeConfig().public;

const stats = computed(() => {
  if (!participants.value || !teams.value) {
    return [];
  }

  const allStats = [{
    title: "Nombre d'équipes",
    value: teams.value.length,
    icon: "i-lucide-users",
  }, {
    title: "Dernière équipe créée",
    value: teams.value.length > 0 ? teams.value.toSorted((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]!.name : "Aucune équipe",
    icon: "i-lucide-clock",
  }, {
    title: "Teams valides",
    value: `${teams.value.filter(team => team.members.every(member => {
      const participant = participants.value!.find(u => u.id === member.id);
      const caution = participant?.caution;
      return caution === CautionStatus.PAID || caution === CautionStatus.WAIVED;
    })).length} / ${teams.value.length}`,
    icon: "i-lucide-wallet",
    condition: dayjs().isBefore(dayjs(eventDateEnd)),
  }, {
    title: "Teams remboursées",
    value: `${teams.value.filter(team => team.members.every(member => {
      const caution = participants.value!.find(participant => participant.id === member.id)?.caution;
      return caution === CautionStatus.REFUNDED || caution === CautionStatus.WAIVED;
    })).length} / ${teams.value.length}`,
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

    <UseFallback v-if="participantsStatus === 'pending' || teamsStatus === 'pending'"/>
    <UPageGrid v-else-if="participantsStatus === 'success' && teamsStatus === 'success'"
               class="gap-4 sm:gap-6 lg:gap-px" v-bind="$attrs">
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
