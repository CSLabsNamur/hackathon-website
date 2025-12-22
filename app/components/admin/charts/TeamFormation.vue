<script setup lang="ts">
const {status, data: participants} = await useParticipants({lazy: true});

type TeamFormationData = {
  name: "En équipe" | "Solo";
  color: string;
  value: number;
};

const participantWithTeamCount = computed(() => participants.value?.filter(participant => participant.team).length ?? 0);

const teamFormationData = computed<TeamFormationData[]>(() => ([
  {name: "En équipe", color: "#0e8d62", value: participantWithTeamCount.value},
  {name: "Solo", color: "#ea6f1c", value: participants.value?.length ?? 0 - participantWithTeamCount.value},
]));

const options = computed<ECOption>(() => ({
  backgroundColor: "transparent",
  title: {
    text: "Répartition des utilisateurs",
    left: "center",
    textStyle: {
      color: "#6b7280",
      fontSize: 16,
      fontWeight: "normal",
    },
  },
  tooltip: {
    trigger: "item",
    formatter: "{c}",
  },
  series: [
    {
      type: "pie",
      data: teamFormationData.value.map(item => ({
        value: item.value,
        name: item.name,
        itemStyle: {color: item.color},
      })),
      animationDuration: 750,
      emphasis: {disabled: true},
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
