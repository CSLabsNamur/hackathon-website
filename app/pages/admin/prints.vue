<script setup lang="ts">
definePageMeta({
  layout: "dashboard",
  middleware: "admin-auth",
});

const toast = useToast();
const {renderAllBadges} = usePrintsActions();

const [
  {status: participantsStatus, data: participants},
  {status: guestsStatus, data: guests},
  {status: sponsorsStatus, data: sponsors},
] = await Promise.all([
  useParticipants({lazy: true}),
  useGuests({lazy: true}),
  useSponsors({lazy: true}),
]);

const isLoading = computed(() => {
  return [participantsStatus.value, guestsStatus.value, sponsorsStatus.value].some((status) => status === "pending");
});

const [isGeneratingBadges, toggleGeneratingBadges] = useToggle(false);

const badgeFilters = reactive({
  participants: true,
  guests: true,
  sponsors: true,
});

const badgeCounts = computed(() => {
  return {
    participants: participants.value?.length ?? 0,
    guests: guests.value?.reduce((total, guest) => total + guest.quantity, 0) ?? 0,
    sponsors: sponsors.value?.reduce((total, sponsor) => total + Number(sponsor.hasBadge), 0) ?? 0,
  };
});

const selectedBadgeCount = computed(() => {
  return (badgeFilters.participants ? badgeCounts.value.participants : 0)
      + (badgeFilters.guests ? badgeCounts.value.guests : 0)
      + (badgeFilters.sponsors ? badgeCounts.value.sponsors : 0);
});

async function downloadAllBadges() {
  if (!selectedBadgeCount.value || isGeneratingBadges.value) {
    return;
  }

  toggleGeneratingBadges(true);
  try {
    const pdf = await renderAllBadges({
      participants: badgeFilters.participants,
      guests: badgeFilters.guests,
      sponsors: badgeFilters.sponsors,
    });
    downloadBlob(pdf, "badges.pdf");
  } catch {
    toast.add({
      title: "Erreur",
      description: "Impossible de générer le PDF regroupant tous les badges.",
      color: "error",
    });
  } finally {
    toggleGeneratingBadges(false);
  }
}
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <DashboardNavbar title="Impressions"/>
    </template>

    <template #body>
      <UContainer>
        <UCard :ui="{body: 'p-6 sm:p-7'}">
          <div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_18rem] xl:items-start">
            <div class="space-y-5">
              <div class="flex flex-wrap items-center gap-3">
                <div class="flex size-11 items-center justify-center
                            rounded-full bg-primary/10 text-primary ring ring-inset ring-primary/20">
                  <UIcon name="i-lucide-id-card"/>
                </div>
                <h2 class="text-lg font-semibold text-highlighted">
                  Badges
                </h2>
              </div>

              <div class="grid gap-3 sm:grid-cols-3">
                <div class="rounded-lg border border-default bg-elevated/30 p-4">
                  <UCheckbox v-model="badgeFilters.participants" :label="`Participants (${badgeCounts.participants})`"/>
                </div>
                <div class="rounded-lg border border-default bg-elevated/30 p-4">
                  <UCheckbox v-model="badgeFilters.guests" :label="`Invités (${badgeCounts.guests})`"/>
                </div>
                <div class="rounded-lg border border-default bg-elevated/30 p-4">
                  <UCheckbox v-model="badgeFilters.sponsors" :label="`Sponsors avec badge (${badgeCounts.sponsors})`"/>
                </div>
              </div>
            </div>

            <div class="flex flex-col gap-3 rounded-xl border border-default bg-elevated/20 p-5 self-end">
              <UButton block size="lg" icon="i-lucide-download" :loading="isGeneratingBadges"
                       :disabled="isLoading || selectedBadgeCount === 0" @click="downloadAllBadges">
                Télécharger le PDF
              </UButton>
              <p class="text-xs text-muted">
                {{ selectedBadgeCount }} badge{{ selectedBadgeCount > 1 ? "s" : "" }}
                sélectionné{{ selectedBadgeCount > 1 ? "s" : "" }}.
              </p>
            </div>
          </div>
        </UCard>
      </UContainer>
    </template>
  </UDashboardPanel>
</template>
