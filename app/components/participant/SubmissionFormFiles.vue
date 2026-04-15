<script setup lang="ts">
import type { FormErrorEvent } from "#ui/types";
import { createUploadSchema, type UploadSchema } from "#shared/schemas/submissions/upload";

const props = defineProps<{
  // TODO: Use Submission instead of CurrentParticipant
  participant: CurrentParticipant;
  submissionRequest: SubmissionRequest;
  canSubmit?: boolean;
  canDelete?: boolean;
}>();
const emit = defineEmits<{ submit: [boolean], deleteFile: [] }>();

const toast = useToast();
const actions = useSubmissionsActions();

const participantSubmission = computed(() => props.participant.submissions.find(s => s.requestId === props.submissionRequest.id));
const existingFiles = computed(() => participantSubmission.value?.files ?? []);

const canSubmitThisRequest = computed(() => Boolean(props.canSubmit));
const canDeleteThisRequest = computed(() => Boolean(props.canDelete));

const scopeDescription = computed(() => {
  if (!props.submissionRequest.teamRequest) {
    return "Chaque participant doit envoyer son propre fichier.";
  }

  const user = participantSubmission.value?.participant.user;
  return user
      ? `Une seule soumission est attendue pour toute l'équipe. La version actuelle a été déposée par ${user.firstName} ${user.lastName}.`
      : "Une seule soumission est attendue pour toute l'équipe.";
});

const state = reactive<UploadSchema>({
  skipped: participantSubmission.value?.skipped ?? false,
  files: undefined,
});

watch(participantSubmission, (submission) => {
  state.skipped = submission?.skipped ?? false;
  state.files = undefined;
}, {immediate: true});

const isSubmitting = ref(false);
const isDeletingFileId = ref<string | null>(null);

const acceptAttr = computed(() => acceptedFormatsToHtmlAccept(props.submissionRequest.acceptedFormats));
const acceptedLabel = computed(() => acceptedFormatsToLabel(props.submissionRequest.acceptedFormats));

const formSchema = computed(() => createUploadSchema(props.submissionRequest.acceptedFormats));

async function onSubmit() {
  if (!canSubmitThisRequest.value) return;

  try {
    isSubmitting.value = true;
    if (!state.files || state.files.length === 0) {
      toast.add({
        title: "Erreur de soumission",
        description: "Veuillez sélectionner au moins un fichier à soumettre.",
        color: "error",
      });
      return;
    }
    await actions.uploadFiles(props.submissionRequest.id, {files: state.files, skipped: false});
    toast.add({title: "Soumission réussie", description: "Votre document a été soumis avec succès.", color: "success"});
    emit("submit", true);
  } finally {
    isSubmitting.value = false;
  }
}

async function onSkip() {
  if (!canSubmitThisRequest.value) return;

  await actions.uploadFiles(props.submissionRequest.id, {files: undefined, skipped: true});
  emit("submit", true);
}

async function onDeleteFile(fileId: string) {
  if (!canDeleteThisRequest.value) return;

  try {
    isDeletingFileId.value = fileId;
    await actions.deleteSubmissionFile(props.submissionRequest.id, fileId);
    toast.add({
      title: "Fichier supprimé",
      description: "Le fichier a été supprimé avec succès.",
      color: "success",
    });
    emit("deleteFile");
  } finally {
    isDeletingFileId.value = null;
  }
}

async function onError(event: FormErrorEvent) {
  console.log("Form error:", event.errors);
  if (event?.errors?.[0]?.id) {
    const element = document.getElementById(event.errors[0].id);
    element?.focus();
    element?.scrollIntoView({behavior: "smooth", block: "center"});
  }
}
</script>

<template>
  <UForm :schema="formSchema" :state class="grid gap-6" @submit="onSubmit" @error="onError">
    <UAlert
        :title="submissionRequest.teamRequest ? 'Soumission d’équipe' : 'Soumission individuelle'"
        :description="scopeDescription"
        color="info"
        variant="soft"
        :icon="submissionRequest.teamRequest ? 'i-lucide-users' : 'i-lucide-user'"
    />

    <UFormField :label="submissionRequest.title" :description="submissionRequest.description || undefined" name="files"
                :error-pattern="/files\.\d*/" :required="submissionRequest.required">
      <div v-auto-animate class="grid gap-2">
        <UFileUpload v-model="state.files" :disabled="isSubmitting || !canSubmitThisRequest"
                     description="Choisir un fichier..."
                     :accept="acceptAttr" layout="list"
                     :required="submissionRequest.required" class="w-full" :multiple="!!submissionRequest.multiple"/>

        <div v-if="existingFiles.length" class="grid gap-1">
          <p class="text-sm text-muted">Fichier(s) déjà envoyé(s) :</p>
          <ul v-auto-animate class="grid gap-1">
            <li v-for="f in existingFiles" :key="f.id" class="flex items-center justify-between gap-2 text-sm">
              <span class="truncate" :title="f.originalName">{{ f.originalName }}</span>
              <UButton size="xs" color="error" variant="ghost"
                       :loading="isDeletingFileId === f.id"
                       :disabled="isSubmitting || !canDeleteThisRequest"
                       @click="onDeleteFile(f.id)">
                Supprimer
              </UButton>
            </li>
          </ul>
        </div>

        <p v-if="acceptedLabel" class="text-xs text-gray-500">
          Formats acceptés : {{ acceptedLabel }}
        </p>
      </div>
    </UFormField>

    <div class="flex gap-1.5 place-self-end">
      <UButton v-if="!submissionRequest.required" variant="subtle" color="secondary"
               :disabled="isSubmitting || !canSubmitThisRequest"
               loading-auto @click="onSkip">
        Passer
      </UButton>
      <UButton type="submit" :loading="isSubmitting" :disabled="!canSubmitThisRequest">
        Soumettre
      </UButton>
    </div>
  </UForm>
</template>
