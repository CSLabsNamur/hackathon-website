<script setup lang="ts">
import type { EventRolloverInput } from "#shared/schemas/settings/rollover";
import PreviewModal from "~/components/admin/event/PreviewModal.vue";

definePageMeta({
  requiredPermissions: ["settings.read"],
});

const {isSuperAdmin} = await useCurrentAdmin();
const {$api} = useNuxtApp();
const toast = useToast();

const {data: archives, status: archivesStatus} = await useAPI("/api/admin/events");
const {data: preview, status: previewStatus, refresh: refreshPreview} = await useAPI("/api/admin/events/preview", {
  immediate: !!isSuperAdmin.value,
});

const overlay = useOverlay();
const previewModal = overlay.create(PreviewModal);

const isSubmitting = ref(false);
const isCleaning = ref(false);
const pendingCleanup = ref(0);
const cleanupFailed = ref(false);
const canRollover = computed(() => !!preview.value && !pendingCleanup.value && !preview.value.paidCautions);

watchImmediate(preview, (value) => {
  if (!value) return;
  pendingCleanup.value = value.pendingCleanup;
});

async function cleanUp() {
  if (isCleaning.value) return;
  isCleaning.value = true;
  cleanupFailed.value = false;

  try {
    do {
      const result = await $api("/api/admin/events/cleanup", {method: "POST"});

      pendingCleanup.value = result.pending;

      if (result.failed || (!result.processed && result.pending)) {
        cleanupFailed.value = true;
        break;
      }
    } while (pendingCleanup.value);
  } catch {
    cleanupFailed.value = true;
  } finally {
    isCleaning.value = false;
    await refreshPreview();
  }
}

async function onSubmit(input: EventRolloverInput) {
  if (isSubmitting.value) return;
  isSubmitting.value = true;

  try {
    const result = await $api("/api/admin/events/rollover", {method: "POST", body: input});

    pendingCleanup.value = result.pendingCleanup;

    toast.add({
      title: "Nouvelle édition créée",
      description: "L'ancienne édition est archivée. Les inscriptions sont fermées.",
      color: "success",
    });

    await refreshNuxtData();
    previewModal.open({archive: true, id: result.archiveId});

    if (pendingCleanup.value) await cleanUp();
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <div class="grid gap-6">
    <UCard v-if="isSuperAdmin" :ui="{header: 'flex items-start justify-between gap-4', body: 'grid gap-4'}">
      <template #header>
        <div class="flex flex-col gap-1">
          <h2 class="text-lg font-semibold text-highlighted">Passer à la prochaine édition</h2>
          <p class="text-sm text-muted">
            Archivez l'événement actuel et préparez le suivant. La suppression des données est irréversible.
          </p>
        </div>
        <UButton color="neutral" variant="ghost" icon="i-lucide-refresh-cw" size="sm"
                 aria-label="Recharger l'aperçu" :loading="previewStatus === 'pending'"
                 :disabled="isSubmitting || isCleaning" @click="refreshPreview()"/>
      </template>

      <UAlert v-if="pendingCleanup" color="warning" icon="i-lucide-loader-circle"
              title="Nettoyage à terminer"
              :description="`${pendingCleanup} fichier(s) ou compte(s) restent à supprimer. La réouverture des inscriptions et les envois d'emails restent bloqués jusque-là.`">
        <template #actions>
          <UButton :loading="isCleaning" color="warning" @click="cleanUp">Reprendre le nettoyage</UButton>
        </template>
      </UAlert>
      <UAlert v-if="cleanupFailed" color="error" variant="soft" icon="i-lucide-alert-circle"
              title="Le nettoyage n'a pas pu être terminé"
              description="Les suppressions restantes sont conservées pour une nouvelle tentative. Revenez plus tard pour réessayer."/>

      <template v-if="preview">
        <UCard variant="subtle" :ui="{body: 'flex flex-wrap items-center justify-between gap-4'}">
          <div class="grid gap-1">
            <p class="text-xs text-muted">Édition actuelle</p>
            <p class="font-medium text-highlighted">{{ preview.event.title }}</p>
            <p class="text-sm text-muted">
              {{ formatDateRange(preview.event.startDate, preview.event.endDate, false) }}
            </p>
          </div>
          <UButton color="neutral" variant="soft" icon="i-lucide-eye"
                   @click="previewModal.open({archive: false, preview})">
            Vérifier l'archive
          </UButton>
        </UCard>

        <UAlert v-if="preview.paidCautions" color="warning" icon="i-lucide-alert-triangle" title="Cautions à traiter"
                :description="`${preview.paidCautions} caution(s) sont encore marquées comme payées. Traitez-les avant de changer d'édition.`"/>

        <AdminEventRolloverForm :event="preview.event" :revision="preview.revision" :disabled="!canRollover"
                                :loading="isSubmitting || isCleaning" @submit="onSubmit"/>
      </template>
      <USkeleton v-else-if="previewStatus === 'pending'" class="h-40 w-full"/>
      <UAlert v-else color="error" variant="soft" icon="i-lucide-alert-circle"
              title="Impossible de charger l'édition actuelle"/>
    </UCard>

    <UCard :ui="{body: 'grid gap-4'}">
      <template #header>
        <div class="flex flex-col gap-1">
          <h2 class="text-lg font-semibold text-highlighted">Éditions archivées</h2>
          <p class="text-sm text-muted">Résumé des anciennes éditions.</p>
        </div>
      </template>
      <USkeleton v-if="archivesStatus === 'pending'" class="h-20 w-full"/>
      <UAlert v-else-if="archivesStatus === 'error'" color="error" variant="soft" icon="i-lucide-alert-circle"
              title="Impossible de charger les archives"/>
      <UEmpty v-else-if="!archives?.length" icon="i-lucide-archive" title="Aucune édition archivée"
              description="L'édition actuelle sera archivée lors du prochain changement d'édition."/>
      <div v-else class="divide-y divide-default">
        <div v-for="item in archives" :key="item.id"
             class="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0 last:pb-0">
          <div class="grid gap-1">
            <p class="font-medium text-highlighted">{{ item.title }}</p>
            <p class="text-sm text-muted">{{ formatDateRange(item.startDate, item.endDate, false) }}</p>
          </div>
          <UButton color="neutral" variant="soft" icon="i-lucide-eye"
                   @click="previewModal.open({archive: true, id: item.id})">
            Consulter
          </UButton>
        </div>
      </div>
    </UCard>
  </div>
</template>
