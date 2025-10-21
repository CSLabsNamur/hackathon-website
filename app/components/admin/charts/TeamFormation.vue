<script setup lang="ts">
type TeamFormationData = {
  name: "En équipe" | "Solo";
  color: string;
  value: number;
}

const participantWithTeamCount = participants.filter(participant => participant.team).length;

const teamFormationData: TeamFormationData[] = [
  {name: "En équipe", color: "#0e8d62", value: participantWithTeamCount},
  {name: "Solo", color: "#ea6f1c", value: participants.length - participantWithTeamCount},
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
