<script setup lang="ts">
import { CautionStatus } from "~/utils/mock";

const dayjs = useDayjs();

const {eventDateEnd} = useRuntimeConfig().public;

const stats = computedWithControl(() => users, () => [{
  title: "Utilisateurs inscrits",
  value: users.length,
  icon: "i-lucide-user-check",
}, {
  title: "Nouvelles inscriptions (7j)",
  value: users.filter(user => dayjs().diff(dayjs(user.createdAt), "day") < 7).length,
  icon: "i-lucide-user-plus",
}, {
  title: "Cautions payées",
  value: `${users.filter(user => user.caution === CautionStatus.Paid).length} / ${users.filter(user => user.caution !== CautionStatus.Refunded && user.caution !== CautionStatus.Waived).length}`,
  icon: "i-lucide-wallet",
  condition: dayjs().isBefore(dayjs(eventDateEnd)),
}, {
  title: "Cautions remboursées",
  value: `${users.filter(user => user.caution === CautionStatus.Refunded).length} / ${users.filter(user => user.caution !== CautionStatus.Waived).length}`,
  icon: "i-lucide-currency-euro",
  condition: dayjs().isAfter(dayjs(eventDateEnd)),
}], {deep: true});
</script>

<template>
  <UPageGrid class="gap-4 sm:gap-6 lg:gap-px">
    <template v-for="(stat, index) in stats">
      <UPageCard v-if="stat.condition === undefined || stat.condition" :key="index" :icon="stat.icon"
                 :title="stat.title" variant="subtle" class="first:rounded-l-lg last:rounded-r-lg lg:rounded-none"
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

<style scoped>

</style>
