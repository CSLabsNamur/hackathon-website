<script setup lang="ts">
definePageMeta({
  layout: "dashboard",
  middleware: "admin-auth",
});
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <DashboardNavbar title="Accueil"/>
    </template>
    <template #body>
      <UContainer>
        <div class="flex flex-col gap-6 lg:gap-8">
          <div class="space-y-px">
            <AdminParticipantStats :rounded="false" class="*:first:rounded-tl-lg *:last:rounded-tr-lg"/>
            <AdminTeamStats :rounded="false" class="*:first:rounded-bl-lg *:last:rounded-br-lg"/>
          </div>
          <UPageGrid class="lg:flex">
            <AdminChartsRegistrationTimeline class="w-2/3"/>
            <AdminChartsTeamFormation class="w-1/3"/>
          </UPageGrid>
        </div>
      </UContainer>
    </template>
  </UDashboardPanel>
</template>
