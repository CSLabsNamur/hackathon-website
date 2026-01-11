<script setup lang="ts">
import type * as v from "valibot";
import type { Reactive } from "vue";
import type { FormErrorEvent, FormSubmitEvent } from "#ui/types";
import { editSubmissionRequestSchema } from "#shared/schemas/submissions/requests/edit";
import { normalizeAcceptedFormats } from "#shared/utils/fileFormats";

const props = defineProps<{ submissionRequest: SubmissionRequest }>();
const emit = defineEmits<{ close: [boolean] }>();

const dayjs = useDayjs();
const toast = useToast();
const {eventDateStart, eventDateEnd} = useRuntimeConfig().public;

const {editSubmissionRequest} = useSubmissionsRequestsActions();

// Create the schema with composables (safe here in setup)
const schema = editSubmissionRequestSchema(eventDateStart, eventDateEnd);

const eventDateStartParsed = dayjs(eventDateStart);
const eventDateEndParsed = dayjs(eventDateEnd);

type Schema = v.InferOutput<typeof schema>

const state: Reactive<Schema> = reactive({
  title: props.submissionRequest.title,
  description: props.submissionRequest.description || "",
  required: props.submissionRequest.required,
  deadline: dayjs(props.submissionRequest.deadline).format("YYYY-MM-DDTHH:mm"),
  acceptedFormats: props.submissionRequest.acceptedFormats ?? [],
});

const formatOptions = [
  {label: "PDF", value: "pdf"},
  {label: "Word (.docx)", value: "docx"},
  {label: "Texte (.txt)", value: "txt"},
  {label: "Images (.jpg/.jpeg)", value: "jpg"},
  {label: "Images (.png)", value: "png"},
  {label: "Archive (.zip)", value: "zip"},
];

const isSubmitting = ref(false);

async function onSubmit(event: FormSubmitEvent<Schema>) {
  try {
    isSubmitting.value = true;

    await editSubmissionRequest(props.submissionRequest.id, {
      ...event.data,
      acceptedFormats: props.submissionRequest.type === SubmissionType.TEXT ? undefined : normalizeAcceptedFormats(event.data.acceptedFormats),
    });

    toast.add({
      title: "Demande de soumission modifiée",
      description: "La demande de soumission a été modifiée avec succès.",
      color: "success",
    });

    // For now, log the payload
    console.log(event.data);

    emit("close", true);
  } finally {
    isSubmitting.value = false;
  }
}

async function onError(event: FormErrorEvent) {
  if (event?.errors?.[0]?.id) {
    const element = document.getElementById(event.errors[0].id);
    element?.focus();
    element?.scrollIntoView({behavior: "smooth", block: "center"});
  }
}
</script>

<template>
  <UModal title="Édition de la demande de soumission"
          :dismissible="!isSubmitting" :close="{disabled: isSubmitting, onClick: () => emit('close', false)}"
          :ui="{content: 'max-w-xl', footer: 'justify-end'}">
    <template #body>
      <UForm id="edit-submission-form" :schema :state class="grid grid-cols-1 lg:grid-cols-2 gap-6"
             :disabled="isSubmitting" @submit="onSubmit" @error="onError">
        <UFormField label="Titre" name="title" required>
          <UInput v-model="state.title" icon="i-lucide-type" class="w-full" placeholder="Titre de la demande"/>
        </UFormField>

        <UFormField label="Description" name="description">
          <UTextarea v-model="state.description" class="w-full" :rows="10"/>
        </UFormField>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <UFormField label="Date limite" name="deadline">
            <UInput v-model="state.deadline" type="datetime-local" icon="i-lucide-clock"
                    :min="eventDateStartParsed.format('YYYY-MM-DDTHH:mm')"
                    :max="eventDateEndParsed.format('YYYY-MM-DDTHH:mm')"/>
          </UFormField>
        </div>

        <UFormField v-if="props.submissionRequest.type === SubmissionType.FILE" label="Formats acceptés"
                    name="acceptedFormats">
          <USelectMenu v-model="state.acceptedFormats" :items="formatOptions" value-key="value" label-key="label"
                       multiple class="w-full" placeholder="Sélectionnez les formats autorisés"/>
        </UFormField>
      </UForm>
    </template>
    <template #footer="{close}">
      <div class="flex justify-end space-x-2">
        <UButton type="submit" form="edit-submission-form" :loading="isSubmitting">Enregistrer</UButton>
        <UButton color="neutral" :disabled="isSubmitting" @click="close">Annuler</UButton>
      </div>
    </template>
  </UModal>
</template>
