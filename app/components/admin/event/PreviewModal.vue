<script setup lang="ts">
import type { EventArchiveDetails, EventArchiveSnapshot } from "#shared/utils/eventArchives";
import ArchiveContent from "./ArchiveContent.vue";

type Preview = {
  event: Pick<EventArchiveDetails, "title" | "startDate" | "endDate">;
  snapshot: EventArchiveSnapshot;
  requests: number;
  emails: number;
};

const props = defineProps<{ archive: true; id: string } | { archive: false; preview: Preview }>();
const emit = defineEmits<{ close: [boolean] }>();

const {data: archivedEdition, status} = await useAPI<EventArchiveDetails>(() => `/api/admin/events/${props.archive ? props.id : ""}`, {
  immediate: props.archive, lazy: true,
});
const preview = computed(() => props.archive ? undefined : props.preview);
const edition = computed(() => props.archive ? archivedEdition.value : {...props.preview.event, snapshot: props.preview.snapshot});
const archiveDownload = useObjectUrl(computed(() => props.archive && archivedEdition.value
    ? new Blob([JSON.stringify(archivedEdition.value, null, 2)], {type: "application/json"})
    : undefined));
</script>

<template>
  <UModal :title="edition?.title || 'Archive'"
          :description="edition ? formatDateRange(edition.startDate, edition.endDate, false) : 'Chargement de l’édition archivée.'"
          :close="{onClick: () => emit('close', false)}"
          :ui="{content: 'max-w-3xl', body: 'grid gap-6', footer: 'justify-end'}">
    <template #body>
      <template v-if="edition">
        <ArchiveContent :snapshot="edition.snapshot"/>
        <template v-if="preview">
          <USeparator/>
          <div class="grid gap-4 grid-cols-1 md:grid-cols-2">
            <div class="grid content-start gap-1">
              <h3 class="font-medium text-highlighted">Conservé pour la prochaine édition</h3>
              <p class="text-sm text-muted">
                Salles, réseaux sociaux, administrateurs et rôles, paramètres du site, lieu et paiement.
              </p>
            </div>
            <div class="grid content-start gap-1">
              <h3 class="font-medium text-highlighted">Supprimé de l'édition active</h3>
              <p class="text-sm text-muted">
                {{ preview.snapshot.counts.participants }} participants, leurs comptes, CV et soumissions,
                {{ preview.snapshot.counts.teams }} équipes, {{ preview.snapshot.counts.guests }} invités,
                {{ preview.requests }} demandes de soumission et {{ preview.emails }} emails.
                Le programme et les sponsors sont transférés à l'archive.
              </p>
            </div>
          </div>
        </template>
      </template>
      <USkeleton v-else-if="status === 'pending' || status === 'idle'" class="h-40 w-full"/>
      <UAlert v-else color="error" variant="soft" icon="i-lucide-alert-circle"
              title="Impossible de charger cette archive"/>
    </template>
    <template #footer="{close}">
      <UButton v-if="archiveDownload" icon="i-lucide-download" color="neutral" variant="soft"
               :href="archiveDownload" :download="`edition-${archivedEdition?.id}.json`" external>
        Exporter en JSON
      </UButton>
      <UButton color="neutral" variant="soft" @click="close">Fermer</UButton>
    </template>
  </UModal>
</template>
