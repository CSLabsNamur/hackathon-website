<script setup lang="ts">
import Fuse from "fuse.js";
import { ParticipantJoinTeamModal } from "#components";

definePageMeta({
  layout: {
    name: "user-dashboard",
    props: {
      title: "Autres équipes",
    },
  },
  middleware: "participant-auth",
  requiredPermissions: ["teams.read"],
});

const [
  {status, data: teams, refresh},
  {data: currentParticipant, refresh: refreshCurrentParticipant},
] = await Promise.all([useParticipantTeamDirectory({lazy: true}), useCurrentParticipant()]);

const {can} = useAbility(currentParticipant);
const canJoinTeam = computed(() => !!currentParticipant.value && !currentParticipant.value.team && can("join", "Team"));
const joinModal = useOverlay().create(ParticipantJoinTeamModal);

async function openJoinModal() {
  if (!canJoinTeam.value) return;
  if (await joinModal.open()) await Promise.all([refreshCurrentParticipant(), refresh()]);
}

const search = useSearchQuery();
const {sorting} = useTableQuery({sort: ["name"]});

const sortOptions = [{label: "Nom : A → Z", value: "asc"}, {label: "Nom : Z → A", value: "desc"}];
const sortOrder = computed({
  get: () => sorting.value[0]?.desc ? "desc" : "asc",
  set: (value: string) => {
    sorting.value = [{id: "name", desc: value === "desc"}];
  },
});

const otherTeams = computed(() => (teams.value ?? [])
    .filter((team) => team.id !== currentParticipant.value?.team?.id),
);
const searchableTeams = computed(() => otherTeams.value.map((team) => ({
  team,
  members: team.members.map((member) => `${member.user.firstName} ${member.user.lastName}`),
})));
const searchIndex = computed(() => new Fuse(searchableTeams.value, {
  keys: ["team.name", "team.description", "members", "team.room.name"],
  ignoreDiacritics: true,
  ignoreLocation: true,
  threshold: 0.3,
}));
const nameCollator = new Intl.Collator("fr", {sensitivity: "base", numeric: true});
const filteredTeams = computed(() => {
  const query = search.value.trim();
  const matches = query ? searchIndex.value.search(query).map((result) => result.item.team) : otherTeams.value;
  const direction = sortOrder.value === "desc" ? -1 : 1;

  return [...matches].sort((a, b) => direction * nameCollator.compare(a.name, b.name));
});

useRefreshOnPageReturn(refresh);
</script>

<template>
  <UContainer class="grid gap-6 max-w-7xl">
    <header class="flex flex-wrap items-center justify-between gap-3">
      <h1 class="text-2xl font-semibold text-highlighted">Autres équipes</h1>
      <UButton v-if="canJoinTeam" icon="i-lucide-user-plus" @click="openJoinModal">
        Rejoindre avec un code
      </UButton>
    </header>

    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <UInput v-model="search" icon="i-lucide-search" class="w-full sm:max-w-md"
              placeholder="Rechercher une équipe ou un membre…"
              aria-label="Rechercher une équipe ou un membre">
        <template v-if="search" #trailing>
          <UButton color="neutral" variant="link" icon="i-lucide-x" size="xs"
                   aria-label="Effacer la recherche" @click="search = ''"/>
        </template>
      </UInput>
      <USelect v-model="sortOrder" :items="sortOptions" class="w-full sm:w-44"
               aria-label="Trier les équipes"/>
    </div>

    <UAlert v-if="status === 'error'" color="error" variant="soft" icon="i-lucide-circle-alert"
            title="Impossible de charger les équipes"
            :actions="[{label: 'Réessayer', color: 'error', variant: 'soft', onClick: () => refresh()}]"/>

    <div v-else-if="!teams" class="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      <USkeleton v-for="n in 6" :key="n" class="h-64"/>
    </div>

    <UEmpty v-else-if="!otherTeams.length" title="Aucune autre équipe" icon="i-lucide-users"/>

    <UEmpty v-else-if="!filteredTeams.length" title="Aucune équipe trouvée"
            icon="i-lucide-search" description="Essayez un autre nom d'équipe ou de participant."
            :actions="[{label: 'Effacer la recherche', color: 'neutral', variant: 'soft', onClick: () => search = ''}]"/>

    <template v-else>
      <p class="text-sm text-muted" role="status">
        {{ filteredTeams.length }} équipe{{ filteredTeams.length > 1 ? "s" : "" }}
        <span v-if="search.trim()">sur {{ otherTeams.length }}</span>
      </p>
      <ul class="grid items-start gap-6 md:grid-cols-2 xl:grid-cols-3">
        <li v-for="team in filteredTeams" :key="team.id" class="min-w-0">
          <ParticipantTeamDirectoryCard :team/>
        </li>
      </ul>
    </template>
  </UContainer>
</template>
