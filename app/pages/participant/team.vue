<script setup lang="ts">
definePageMeta({
  layout: "user-dashboard",
});

</script>

<template>
  <UDashboardPanel>
    <template #header>
      <DashboardNavbar title="Mon équipe"/>
    </template>
    <template #body>
      <UContainer>
        <ParticipantNoTeamCTA v-if="!currentTeam"/>

        <UPageGrid v-else>
          <UPageCard class="col-span-2 row-span-2" :title="currentTeam.name">
            <template #default>
            </template>
          </UPageCard>
          <div class="flex flex-col gap-2">
            <UCard>
              <USkeleton class="h-40 rounded-xl"/>
            </UCard>
            <UCard>
              <USkeleton class="h-40 rounded-xl"/>
            </UCard>
          </div>
        </UPageGrid>
      </UContainer>
    </template>
  </UDashboardPanel>
</template>
