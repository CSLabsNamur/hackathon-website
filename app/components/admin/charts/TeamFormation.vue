<script setup lang="ts">
const {status, data: participants} = await useParticipants({lazy: true});

type TeamFormationData = {
  name: "En équipe" | "Solo";
  color: string;
  value: number;
}

const participantWithTeamCount = participants.value?.filter(participant => participant.team).length ?? 0;

const teamFormationData: TeamFormationData[] = [
  {name: "En équipe", color: "#0e8d62", value: participantWithTeamCount},
  {name: "Solo", color: "#ea6f1c", value: participants.value?.length ?? 0 - participantWithTeamCount},
];

const options: ECOption = {
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
      data: teamFormationData.map(item => ({
        value: item.value,
        name: item.name,
        itemStyle: {
          color: item.color,
        },
      })),
      animationDuration: 750,
      emphasis: {disabled: true},
    },
  ],
};
</script>

<template>
  <div class="h-80">
    <VChart :option="options" autoresize/>
  </div>
</template>
