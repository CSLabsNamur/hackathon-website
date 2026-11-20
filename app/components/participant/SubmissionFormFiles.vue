<script setup lang="ts">
import * as v from "valibot";
import { createUploadSchema } from "#shared/schemas/submissions/upload";
import type { CurrentParticipantSubmission } from "#shared/utils/types";

const draft = defineModel<SubmissionDraft>({required: true});
const props = defineProps<{
  submissionRequest: SubmissionRequest;
  submission?: CurrentParticipantSubmission;
  disabled: boolean;
  busy: boolean;
  canDelete: boolean;
  canSubmit: boolean;
  canSkip: boolean;
}>();
const emit = defineEmits<{
  submit: [];
  skip: [];
  deleteFile: [id: string];
}>();

const selectedFiles = computed({
  get: () => props.submissionRequest.multiple ? draft.value.files : draft.value.files[0] ?? null,
  set: (value: File | File[] | null | undefined) => {
    draft.value.files = Array.isArray(value) ? value : value ? [value] : [];
  },
});

const formState = computed(() => ({files: draft.value.files, skipped: false}));
const formSchema = computed(() => createUploadSchema(props.submissionRequest.acceptedFormats, !!props.submissionRequest.multiple));

const accept = computed(() => acceptedFormatsToHtmlAccept(props.submissionRequest.acceptedFormats));
const acceptedLabel = computed(() => acceptedFormatsToLabel(props.submissionRequest.acceptedFormats));

const validation = computed(() => v.safeParse(formSchema.value, formState.value));
const validationError = computed(() => draft.value.files.length && !validation.value.success ? validation.value.issues[0]?.message : undefined);

const canSubmit = computed(() => props.canSubmit && !props.disabled && !props.busy && validation.value.success);
</script>

<template>
  <div class="grid gap-5">
    <div v-if="submission?.files.length" class="grid gap-3">
      <h3 class="text-sm font-medium text-highlighted">Fichiers enregistrés</h3>
      <ul class="divide-y divide-default rounded-md border border-default">
        <li v-for="file in submission.files" :key="file.id" class="flex items-center gap-3 p-3">
          <UIcon name="i-lucide-file" class="size-5 shrink-0 text-muted"/>
          <div class="min-w-0 flex-1 grid gap-1">
            <span class="text-sm wrap-anywhere">{{ file.originalName }}</span>
            <span class="text-xs text-muted">{{ Math.ceil(file.size / 1024) }} Ko</span>
          </div>
          <UButton v-if="canDelete" color="error" variant="ghost" icon="i-lucide-trash-2" size="sm"
                   :aria-label="`Supprimer ${file.originalName}`" :disabled="disabled || busy"
                   @click="emit('deleteFile', file.id)"/>
        </li>
      </ul>
    </div>

    <UForm :schema="formSchema" :state="formState" :disabled="disabled || busy || !props.canSubmit" class="grid gap-5"
           @submit="canSubmit && emit('submit')">
      <UFormField :label="submissionRequest.multiple ? 'Ajouter des fichiers' : 'Fichier à envoyer'" name="files"
                  :error-pattern="/files\.\d*/" :error="validationError" required>
        <UFileUpload v-model="selectedFiles" :multiple="!!submissionRequest.multiple" :accept
                     :label="submissionRequest.multiple ? 'Choisir des fichiers' : 'Choisir un fichier'"
                     description="Cliquez ou glissez-déposez vos fichiers ici."
                     layout="list" class="w-full" :disabled="disabled || busy || !props.canSubmit"/>
        <template #hint>5 Mo maximum par envoi</template>
        <template #help>
          <span v-if="acceptedLabel">Formats acceptés : {{ acceptedLabel }}.</span>
          <span v-if="submissionRequest.multiple"> Maximum {{ MAX_SUBMISSION_FILES }} fichiers par envoi.</span>
          <span v-else-if="submission?.files.length"> Le nouveau fichier remplacera le précédent.</span>
        </template>
      </UFormField>
      <div class="flex flex-wrap justify-end gap-2">
        <UButton v-if="canSkip" color="neutral" variant="soft"
                 :disabled="disabled || busy || !props.canSubmit" @click="emit('skip')">
          Ne pas remettre
        </UButton>
        <UButton type="submit" :loading="busy" :disabled="!canSubmit">Envoyer</UButton>
      </div>
    </UForm>
  </div>
</template>
