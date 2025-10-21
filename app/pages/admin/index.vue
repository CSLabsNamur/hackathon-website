<script setup lang="ts">
definePageMeta({
  layout: "dashboard",
});
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <AdminDashboardNavbar title="Accueil"/>
    </template>
    <template #body>
      <UContainer>
        <div class="flex flex-col gap-6 lg:gap-8">
          <div class="space-y-px">
            <AdminParticipantStats :rounded="false" class="*:first:rounded-tl-lg *:last:rounded-tr-lg"/>
            <AdminTeamStats :rounded="false" class="*:first:rounded-bl-lg *:last:rounded-br-lg"/>
          </div>
          <UPageGrid class="lg:flex">
            <AdminChartsRegistrationTimeline class="lg:w-2/3"/>
            <AdminChartsTeamFormation class="lg:w-1/3"/>
          </UPageGrid>
        </div>
      </UContainer>
    </template>
  </UDashboardPanel>
</template>
