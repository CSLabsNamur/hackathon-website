<script setup lang="ts">
import { CautionStatus } from "~/utils/mock";

withDefaults(defineProps<{ rounded?: boolean; }>(), {rounded: true});

const dayjs = useDayjs();

const {eventDateEnd} = useRuntimeConfig().public;

const stats = computedWithControl(() => participants, () => [{
  title: "Nombre d'équipes",
  value: teams.value.length,
  icon: "i-lucide-users",
}, {
  title: "Dernière équipe créée",
  value: teams.value.length > 0 ? teams.value.toSorted((a, b) => b.createdAt - a.createdAt)[0]!.name : "Aucune équipe",
  icon: "i-lucide-clock",
}, {
  title: "Teams valides",
  value: `${teams.value.filter(team => team.members.every(member => {
    const participant = participants.value.find(u => u.id === member);
    const caution = participant?.caution;
    return caution === CautionStatus.Paid || caution === CautionStatus.Waived;
  })).length} / ${teams.value.length}`,
  icon: "i-lucide-wallet",
  condition: dayjs().isBefore(dayjs(eventDateEnd)),
}, {
  title: "Teams remboursées",
  value: `${teams.value.filter(team => team.members.every(member => {
    const caution = participants.value.find(participant => participant.id === member)?.caution;
    return caution === CautionStatus.Refunded || caution === CautionStatus.Waived;
  })).length} / ${teams.value.length}`,
  icon: "i-lucide-currency-euro",
  condition: dayjs().isAfter(dayjs(eventDateEnd)),
}], {deep: true});
</script>

<template>
  <UPageGrid class="gap-4 sm:gap-6 lg:gap-px">
    <template v-for="(stat, index) in stats">
      <UPageCard v-if="stat.condition === undefined || stat.condition" :key="index" :icon="stat.icon"
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
</template>
