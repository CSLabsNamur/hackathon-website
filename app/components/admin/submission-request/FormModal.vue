<script setup lang="ts">
import type { FormSubmitEvent } from "#ui/types";
import type { FetchError } from "ofetch";
import type { InferOutput } from "valibot";
import { submissionRequestFormSchema } from "#shared/schemas/submissions/requests/create";

const props = defineProps<{
  request?: AdminSubmissionRequest;
  settings: { editionId: string; startDate: string; endDate: string };
}>();
const emit = defineEmits<{ close: [boolean] }>();

const toast = useToast();
const {createSubmissionRequest, editSubmissionRequest} = useSubmissionsRequestsActions();

const {request} = props;

const dateTimeFormat = "YYYY-MM-DDTHH:mm";
const {startDate, endDate, editionId} = props.settings;
const minDeadline = formatDate(startDate, dateTimeFormat);
const maxDeadline = formatDate(endDate, dateTimeFormat);

const schema = submissionRequestFormSchema(startDate, endDate);
type Schema = InferOutput<typeof schema>;

const structureLocked = Boolean(request?._count.submissions);
const requestType: Schema["type"] = request?.type === SubmissionType.FILE ? (request.multiple ? "files" : "file") : "text";
const acceptedFormats = request ? normalizeAcceptedFormats(request.acceptedFormats) : [...DEFAULT_ACCEPTED_FORMATS_EXTS];

const state = reactive({
  type: requestType,
  title: request?.title ?? "",
  description: request?.description ?? "",
  deadline: request ? formatDate(request.deadline, dateTimeFormat) : maxDeadline,
  required: request?.required ?? false,
  teamRequest: request?.teamRequest ?? false,
  acceptedFormats,
});

const formats = [...new Set([...DEFAULT_ACCEPTED_FORMATS_EXTS, ...acceptedFormats])]
    .map((extension) => ({label: extension.toUpperCase(), value: extension}));

const types = [
  {label: "Texte", value: "text", icon: "i-lucide-text"},
  {label: "Fichier unique", value: "file", icon: "i-lucide-file"},
  {label: "Fichiers multiples", value: "files", icon: "i-lucide-files"},
];

const isSubmitting = ref(false);
const errorMessage = ref<string>();

async function onSubmit({data}: FormSubmitEvent<Schema>) {
  if (isSubmitting.value) return;

  isSubmitting.value = true;
  errorMessage.value = undefined;

  try {
    if (request) {
      const {title, description, deadline, required, teamRequest, acceptedFormats} = data;
      const fields = {title, description, deadline, expectedUpdatedAt: request.updatedAt};
      await editSubmissionRequest(request.id, structureLocked ? fields : {
        ...fields,
        required,
        teamRequest,
        acceptedFormats,
      });
    } else {
      await createSubmissionRequest({...data, expectedEditionId: editionId});
    }
    toast.add({title: request ? "Demande modifiée" : "Demande créée", color: "success"});
    emit("close", true);
  } catch (error) {
    const response = error as FetchError<{ statusMessage?: string; message?: string }>;
    errorMessage.value = response.data?.statusMessage || response.data?.message || "L’enregistrement a échoué. Réessayez.";
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <UModal :title="request ? 'Modifier la demande' : 'Nouvelle demande de soumission'" :dismissible="!isSubmitting"
          :close="!isSubmitting" :ui="{content: 'max-w-xl', footer: 'flex-wrap justify-end'}">
    <template #body>
      <UForm id="submission-request-form" :schema :state :disabled="isSubmitting" class="grid min-w-0 grid-cols-1 gap-5"
             @submit="onSubmit">
        <UAlert v-if="errorMessage" color="error" variant="soft" icon="i-lucide-circle-alert"
                title="Impossible d’enregistrer la demande" :description="errorMessage"/>

        <UFormField label="Titre" name="title" required>
          <UInput v-model="state.title" class="w-full min-w-0" maxlength="50"/>
        </UFormField>

        <UFormField label="Consignes" name="description">
          <UTextarea v-model="state.description" class="w-full min-w-0" :rows="3" maxlength="150"/>
        </UFormField>

        <UFormField label="Échéance" name="deadline" help="Heure de Bruxelles" required>
          <UInput v-model="state.deadline" type="datetime-local" :min="minDeadline" :max="maxDeadline"
                  class="w-full min-w-0" :ui="{base: 'min-w-0'}"/>
        </UFormField>

        <USeparator/>

        <UFormField v-if="!request" label="Type de réponse" name="type" required>
          <USelect v-model="state.type" :items="types" class="w-full min-w-0"/>
        </UFormField>

        <UAlert v-if="structureLocked" color="neutral" variant="soft" icon="i-lucide-lock"
                title="La demande a déjà reçu des réponses"
                description="Vous pouvez modifier le titre, les consignes et l’échéance."/>

        <template v-else>
          <UFormField v-if="state.type !== 'text'" label="Formats acceptés" name="acceptedFormats"
                      help="Sans sélection, tout format reconnu par le serveur est accepté.">
            <USelectMenu v-model="state.acceptedFormats" :items="formats" value-key="value" multiple
                         class="w-full min-w-0" placeholder="Sélectionner les formats">
              <template #default>
                <span class="min-w-0 truncate">
                  {{ state.acceptedFormats.length ? state.acceptedFormats.join(", ") : "Aucun format sélectionné" }}
                </span>
              </template>
            </USelectMenu>
          </UFormField>

          <UFormField label="Portée" name="teamRequest">
            <UCheckbox v-model="state.teamRequest" label="Une réponse par équipe"
                       description="Sinon, chaque participant répond individuellement."/>
          </UFormField>

          <UFormField name="required">
            <UCheckbox v-model="state.required" label="Réponse obligatoire"/>
          </UFormField>
        </template>
      </UForm>
    </template>

    <template #footer="{close}">
      <UButton color="neutral" variant="soft" :disabled="isSubmitting" @click="close">Annuler</UButton>
      <UButton type="submit" form="submission-request-form" :loading="isSubmitting">Enregistrer</UButton>
    </template>
  </UModal>
</template>
