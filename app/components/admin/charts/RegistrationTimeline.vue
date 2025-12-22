<script setup lang="ts">
const {status, data: participants} = await useParticipants({lazy: true});

const dayjs = useDayjs();

type RegistrationTimelineData = {
  month: string;  // e.g., "2024-01"
  value: number;  // number of users registered in that month
}

const participantChartData = computed<RegistrationTimelineData[]>(() => {
  if (!participants.value) {
    return [];
  }

  const monthMap = new Map<string, number>();

  participants.value.forEach(participant => {
    const month = dayjs(participant.createdAt).format("YYYY-MM");
    monthMap.set(month, (monthMap.get(month) || 0) + 1);
  });

  return Array.from(monthMap, ([month, value]) => ({month, value}))
      .sort((a, b) => a.month.localeCompare(b.month));
});

const options = computed<ECOption>(() => ({
  backgroundColor: "transparent",
  title: {
    text: "Inscriptions des participants au fil du temps",
    left: "center",
    textStyle: {
      color: "#6b7280",
      fontSize: 16,
      fontWeight: "normal",
    },
  },
  tooltip: {
    trigger: "axis",
    // yeah idk what type this is
    //eslint-disable-next-line @typescript-eslint/no-explicit-any
    formatter: (params: any) => {
      const param = params[0];
      return `${dayjs(param.axisValue).format("MMM YYYY")}: ${param.data.value} inscriptions`;
    },
  },
  xAxis: {
    type: "category",
    data: participantChartData.value.map(data => data.month),
    axisLabel: {
      formatter: (value: string) => dayjs(value).format("MMM YYYY"),
    },
  },
  yAxis: {
    type: "value",
  },
  series: [
    {
      type: "line",
      data: participantChartData.value,
      areaStyle: {
        opacity: 0.3,
      },
      smooth: true,
      lineStyle: {
        color: "#22c55e",
      },
      itemStyle: {
        color: "#22c55e",
      },
      animationDuration: 750,
      label: {},
    },
  ],
}));
</script>

<template>
  <ClientOnly>
    <template #fallback>
      <USkeleton class="h-80 rounded-md" v-bind="$attrs"/>
    </template>

    <USkeleton v-if="status !== 'success'" class="h-80 rounded-md" v-bind="$attrs"/>

    <div v-else class="h-80">
      <VChart :option="options" autoresize/>
    </div>
  </ClientOnly>
</template>
