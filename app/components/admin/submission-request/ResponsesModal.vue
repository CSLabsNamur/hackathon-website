<script setup lang="ts">
const props = defineProps<{ request: AdminSubmissionRequest }>();

const {$api} = useNuxtApp();
const supabase = useSupabaseClient();
const toast = useToast();
const dayjs = useDayjs();

const {state: responses, isLoading, error, executeImmediate: refresh} = useAsyncState(
    () => $api<AdminSubmissionResponse[]>(`/api/admin/submission-requests/${props.request.id}/responses`, {silent: true}),
    null,
);

const search = ref("");
const matches = computed(() => {
  const query = search.value.trim().toLocaleLowerCase("fr");
  return (responses.value ?? []).filter(({author, team}) => {
    const name = `${author.firstName} ${author.lastName} ${team ?? ""}`;
    return name.toLocaleLowerCase("fr").includes(query);
  });
});

const downloading = ref<string>();

async function download(file: { id: string; bucket: string; path: string; originalName: string }) {
  if (downloading.value) return;
  downloading.value = file.id;
  try {
    const {data, error: downloadError} = await supabase.storage.from(file.bucket).download(file.path);
    if (downloadError) throw downloadError;
    downloadBlob(data, file.originalName);
  } catch {
    toast.add({title: "Impossible de télécharger le fichier", description: file.originalName, color: "error"});
  } finally {
    downloading.value = undefined;
  }
}
</script>

<template>
  <UModal title="Réponses reçues" :description="request.title"
          :ui="{content: 'max-w-2xl', description: 'wrap-anywhere'}">
    <template #body>
      <div v-if="isLoading" class="grid gap-3" aria-label="Chargement des réponses">
        <USkeleton v-for="n in 3" :key="n" class="h-16"/>
      </div>

      <UAlert v-else-if="error" title="Impossible de charger les réponses" color="error" variant="soft"
              icon="i-lucide-circle-alert"
              :actions="[{label: 'Réessayer', color: 'error', variant: 'soft', onClick: () => refresh()}]"/>

      <UEmpty v-else-if="!responses?.length" title="Aucune réponse reçue" icon="i-lucide-inbox"/>

      <div v-else class="grid min-w-0 gap-4">
        <UInput v-model="search" icon="i-lucide-search" class="w-full"
                placeholder="Participant ou équipe" aria-label="Rechercher une réponse"/>

        <UEmpty v-if="!matches.length" title="Aucune réponse trouvée" icon="i-lucide-search"/>
        <ul v-else class="grid min-w-0 gap-3">
          <li v-for="response in matches" :key="response.id" class="min-w-0 rounded-lg border border-default">
            <details class="p-3">
              <summary class="cursor-pointer text-sm text-highlighted">
                <span class="font-medium wrap-anywhere">
                  {{ response.team || `${response.author.firstName} ${response.author.lastName}` }}
                </span>
                <span class="ms-2 inline-flex flex-wrap gap-1 align-middle">
                  <UBadge v-if="response.skipped" color="neutral" variant="subtle" size="sm">Non remis</UBadge>
                  <UBadge v-else-if="response.hasAnswer" color="success" variant="subtle" size="sm">Remis</UBadge>
                  <UBadge v-else color="warning" variant="subtle" size="sm">Sans contenu</UBadge>
                  <UBadge v-if="!response.current" color="neutral" variant="subtle" size="sm">Historique</UBadge>
                </span>
              </summary>

              <div class="mt-3 grid gap-3">
                <p class="text-xs text-muted">
                  {{ dayjs(response.updatedAt).tz("Europe/Brussels").format("DD/MM/YYYY à HH:mm") }}
                  <span v-if="request.teamRequest">
                    · {{ response.author.firstName }} {{ response.author.lastName }}
                  </span>
                </p>
                <p v-if="response.content" class="text-sm whitespace-pre-wrap wrap-anywhere">{{ response.content }}</p>
                <ul v-if="response.files.length" class="grid gap-2">
                  <li v-for="file in response.files" :key="file.id" class="flex min-w-0 items-center gap-2">
                    <span class="flex-1 min-w-0 text-sm wrap-anywhere">{{ file.originalName }}</span>
                    <UButton color="neutral" variant="soft" icon="i-lucide-download" size="sm"
                             :aria-label="`Télécharger ${file.originalName}`" :loading="downloading === file.id"
                             :disabled="Boolean(downloading)" @click="download(file)"/>
                  </li>
                </ul>
              </div>
            </details>
          </li>
        </ul>
      </div>
    </template>
  </UModal>
</template>
