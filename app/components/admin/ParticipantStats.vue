<script setup lang="ts">
import { CautionStatus } from "~/utils/mock";

withDefaults(defineProps<{ rounded?: boolean; }>(), {rounded: true});

const dayjs = useDayjs();

const {eventDateEnd} = useRuntimeConfig().public;

const stats = computedWithControl(() => participants, () => [{
  title: "Utilisateurs inscrits",
  value: participants.length,
  icon: "i-lucide-user-check",
}, {
  title: "Nouvelles inscriptions (7j)",
  value: participants.filter(participant => dayjs().diff(dayjs(participant.createdAt), "day") < 7).length,
  icon: "i-lucide-user-plus",
}, {
  title: "Cautions payées",
  value: `${participants.filter(participant => participant.caution === CautionStatus.Paid).length} / ${participants.filter(participant => participant.caution !== CautionStatus.Refunded && participant.caution !== CautionStatus.Waived).length}`,
  icon: "i-lucide-wallet",
  condition: dayjs().isBefore(dayjs(eventDateEnd)),
}, {
  title: "Cautions remboursées",
  value: `${participants.filter(participant => participant.caution === CautionStatus.Refunded).length} / ${participants.filter(participant => participant.caution !== CautionStatus.Waived).length}`,
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
