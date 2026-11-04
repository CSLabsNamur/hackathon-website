<script setup lang="ts">
import Fuse from "fuse.js";
import CancelPresenceModal from "~/components/admin/participants/CancelPresenceModal.vue";

definePageMeta({
  layout: {
    name: "dashboard",
    props: {
      title: "Check-in",
    },
  },
  middleware: "admin-auth",
  requiredPermissions: ["participants.check_in"],
});

const toast = useToast();
const overlay = useOverlay();
const dayjs = useDayjs();
const search = useSearchQuery();

const {data: participants, status, error, refresh} = await useParticipantCheckIn();
const {updateCheckIn} = useParticipantsActions();

const cancelPresenceModal = overlay.create(CancelPresenceModal);

const attendance = ref("all");
const pendingId = ref<string | null>(null);

const total = computed(() => participants.value?.length ?? 0);
const present = computed(() => participants.value?.filter((participant) => participant.checkedInAt).length ?? 0);
const metrics = computed(() => [
  {label: "Inscrits", value: total.value},
  {label: "Présents", value: present.value},
  {label: "À accueillir", value: total.value - present.value},
]);
const attendanceItems = computed(() => [
  {label: `Tous (${total.value})`, value: "all"},
  {label: `À accueillir (${total.value - present.value})`, value: "expected"},
  {label: `Présents (${present.value})`, value: "present"},
]);

const searchIndex = computed(() => new Fuse((participants.value ?? []).map((participant) => ({
  ...participant,
  name: `${participant.user.firstName} ${participant.user.lastName}`,
  reversedName: `${participant.user.lastName} ${participant.user.firstName}`,
})), {
  keys: ["name", "reversedName", "user.email", "team.name"],
  threshold: 0.2,
  ignoreLocation: true,
  ignoreDiacritics: true,
}));

const filteredParticipants = computed(() => {
  const matches = search.value.trim()
      ? searchIndex.value.search(search.value.trim()).map((result) => result.item)
      : participants.value ?? [];

  return matches.filter((participant) => attendance.value === "all"
      || (attendance.value === "present" ? !!participant.checkedInAt : !participant.checkedInAt));
});

async function refreshParticipants() {
  if (pendingId.value || status.value === "pending") return;
  await refresh();
}

const visibility = useDocumentVisibility();
useIntervalFn(() => {
  if (visibility.value === "visible" && !error.value) {
    refreshParticipants();
  }
}, 10000);
useRefreshOnPageReturn(refreshParticipants);

async function checkInParticipant(participant: Pick<ParticipantPublicProfile, "id" | "user">) {
  if (pendingId.value) return;
  pendingId.value = participant.id;

  try {
    await updateCheckIn(participant.id, true);
    await refresh();
    toast.add({
      title: "Présence enregistrée",
      description: `${participant.user.firstName} ${participant.user.lastName}`,
      color: "success",
      icon: "i-lucide-user-check",
    });
  } catch {
    /* empty */
  } finally {
    pendingId.value = null;
  }
}

async function cancelPresence(participant: Pick<ParticipantPublicProfile, "id" | "user">) {
  if (pendingId.value || error.value) return;
  pendingId.value = participant.id;

  try {
    const result = await cancelPresenceModal.open({participant});
    if (result) await refresh();
  } finally {
    pendingId.value = null;
  }
}
</script>

<template>
  <UContainer class="flex flex-col gap-6">
    <div class="grid grid-cols-3 gap-3" aria-live="polite">
      <UCard v-for="metric in metrics" :key="metric.label" :ui="{body: 'p-4 sm:p-4'}">
        <p class="text-sm text-muted">{{ metric.label }}</p>
        <p class="text-2xl font-semibold">{{ participants ? metric.value : "—" }}</p>
      </UCard>
    </div>

    <UAlert v-if="error" color="error" variant="subtle" icon="i-lucide-wifi-off"
            title="La liste des présences n'a pas pu être actualisée."
            description="Vérifiez votre connexion et actualisez avant de poursuivre."/>

    <UCard :ui="{body: 'p-0 sm:p-0'}">
      <template #header>
        <div class="flex flex-col gap-3 sm:flex-row">
          <UInput v-model="search" icon="i-lucide-search" size="lg" autofocus class="flex-1"
                  placeholder="Nom, prénom, email ou équipe…" aria-label="Rechercher un participant">
            <template v-if="search" #trailing>
              <UButton icon="i-lucide-x" color="neutral" variant="link" size="sm"
                       aria-label="Effacer la recherche" @click="search = ''"/>
            </template>
          </UInput>
          <USelect v-model="attendance" :items="attendanceItems" size="lg" class="sm:w-48"
                   aria-label="Filtrer par présence"/>
          <UButton icon="i-lucide-refresh-cw" color="neutral" variant="outline" square
                   :loading="status === 'pending'" :disabled="!!pendingId" aria-label="Actualiser les présences"
                   @click="refreshParticipants"/>
        </div>
      </template>

      <div v-if="!participants && status === 'pending'" class="p-6 text-muted" role="status">
        Chargement des participants…
      </div>
      <ul v-else-if="filteredParticipants.length" class="divide-y divide-default">
        <li v-for="participant in filteredParticipants" :key="participant.id"
            class="flex flex-wrap items-center justify-between gap-4 p-4">
          <div class="min-w-0 flex-1 basis-48">
            <p class="font-medium">{{ participant.user.firstName }} {{ participant.user.lastName }}</p>
            <p class="text-sm text-muted break-all">{{ participant.user.email }}</p>
            <p class="text-sm text-muted">{{ participant.team?.name ?? "Sans équipe" }}</p>
          </div>
          <div class="flex items-center gap-3">
            <template v-if="participant.checkedInAt">
              <div class="grid gap-1 text-center">
                <UBadge color="success" variant="subtle" icon="i-lucide-check">Présent</UBadge>
                <p class="text-xs text-muted">
                  {{ dayjs(participant.checkedInAt).format("DD/MM à HH:mm") }}
                </p>
              </div>
              <UButton icon="i-lucide-undo-2" color="neutral" variant="ghost" label="Annuler"
                       :disabled="!!pendingId || !!error" @click="cancelPresence(participant)"/>
            </template>
            <UButton v-else icon="i-lucide-user-check" label="Marquer présent" size="lg"
                     :loading="pendingId === participant.id" :disabled="!!pendingId || !!error"
                     @click="checkInParticipant(participant)"/>
          </div>
        </li>
      </ul>
      <p v-else class="p-6 text-center text-muted" role="status">
        {{ error ? "Liste indisponible." : "Aucun participant trouvé." }}
      </p>

      <template #footer>
        <p class="text-sm text-muted">Actualisation automatique toutes les 10 secondes.</p>
      </template>
    </UCard>
  </UContainer>
</template>
