<script setup lang="ts">
import { ParticipantEditModal } from "#components";

definePageMeta({
  layout: {
    name: "user-dashboard",
    props: {
      title: "Mon profil",
    },
  },
  middleware: "participant-auth",
  requiredPermissions: ["participants.read.own"],
});

const {status, data: currentParticipant, refresh: refreshCurrentParticipant} = await useCurrentParticipant();
const {can} = useAbility(currentParticipant);
const canUpdateProfile = computed(() => can("updateOwn", "Participant"));
const {setActions} = useDashboardNavbar();
const overlay = useOverlay();

const editModal = overlay.create(ParticipantEditModal);

const openEditModal = async () => {
  if (!currentParticipant.value || !canUpdateProfile.value) return;

  const result = await editModal.open({participant: currentParticipant.value});
  if (result) await refreshCurrentParticipant();
};

setActions(computed(() => currentParticipant.value ? [{
  label: "Modifier",
  icon: "i-lucide-edit-2",
  disabled: !canUpdateProfile.value,
  onClick: openEditModal,
}] : []));
</script>

<template>
  <UContainer class="grid gap-6 max-w-7xl">
    <UAlert v-if="status === 'error'" color="error" variant="soft" icon="i-lucide-circle-alert"
            title="Impossible de charger votre profil"
            :actions="[{label: 'Réessayer', color: 'error', variant: 'soft', onClick: () => refreshCurrentParticipant()}]"/>

    <div v-else-if="!currentParticipant" class="grid gap-6">
      <USkeleton class="h-20 w-full"/>
      <div class="grid gap-6 lg:grid-cols-3">
        <USkeleton class="h-80 lg:col-span-2"/>
        <USkeleton class="h-64"/>
      </div>
    </div>

    <template v-else>
      <header class="flex flex-wrap items-center justify-between gap-4">
        <div class="flex min-w-0 items-center gap-3">
          <UAvatar :alt="`${currentParticipant.user.firstName} ${currentParticipant.user.lastName}`"
                   size="lg"/>
          <h1 class="min-w-0 text-2xl font-semibold text-highlighted wrap-anywhere">
            {{ currentParticipant.user.firstName }} {{ currentParticipant.user.lastName }}
          </h1>
        </div>
        <UButton :to="`/participant/${currentParticipant.id}`" target="_blank"
                 color="neutral" variant="ghost" trailing-icon="i-lucide-external-link">
          Voir mon profil public
        </UButton>
      </header>

      <div class="grid items-start gap-6 lg:grid-cols-3">
        <div class="min-w-0 grid gap-6 lg:col-span-2">
          <ParticipantProfileDetailsCard :participant="currentParticipant"/>
          <ParticipantProfileParticipationCard :participant="currentParticipant"/>
        </div>
        <ParticipantProfileCautionCard :participant="currentParticipant" class="min-w-0"/>
      </div>
    </template>
  </UContainer>
</template>
