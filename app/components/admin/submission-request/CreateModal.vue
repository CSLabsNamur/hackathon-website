<script setup lang="ts">
import type * as v from "valibot";
import type { Reactive } from "vue";
import type { FormErrorEvent, FormSubmitEvent } from "#ui/types";
import { createSubmissionRequestSchema } from "#shared/schemas/submissions/requests/create";
import { DEFAULT_ACCEPTED_FORMATS_EXTS, normalizeAcceptedFormats } from "#shared/utils/fileFormats";

const emit = defineEmits<{ close: [boolean] }>();

const dayjs = useDayjs();
const toast = useToast();
const {eventDateStart, eventDateEnd} = useRuntimeConfig().public;

const {createSubmissionRequest} = useSubmissionsRequestsActions();

// Create the schema with composables (safe here in setup)
const schema = createSubmissionRequestSchema(eventDateStart, eventDateEnd);

const eventDateStartParsed = dayjs(eventDateStart);
const eventDateEndParsed = dayjs(eventDateEnd);

type Schema = v.InferOutput<typeof schema>

const state: Reactive<Schema> = reactive({
  type: "text",
  title: "",
  acceptedFormats: [...DEFAULT_ACCEPTED_FORMATS_EXTS],
  deadline: eventDateEndParsed.subtract(1, "minute").format("YYYY-MM-DDTHH:mm"),
});

const typeItems = [{
  label: "Texte",
  value: "text",
  icon: "i-lucide-text",
}, {
  label: "Fichier unique",
  value: "file",
  icon: "i-lucide-file",
}, {
  label: "Fichiers multiples",
  value: "files",
  icon: "i-lucide-files",
}];

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

    await createSubmissionRequest({
      ...event.data,
      acceptedFormats: event.data.type === "text" ? undefined : normalizeAcceptedFormats(event.data.acceptedFormats),
    });

    toast.add({
      title: "Demande de soumission créée",
      description: "La nouvelle demande de soumission a été créée avec succès.",
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
  <UModal title="Nouvelle demande de soumission"
          :dismissible="!isSubmitting" :close="{disabled: isSubmitting, onClick: () => emit('close', false)}"
          :ui="{content: 'max-w-xl', footer: 'justify-end'}">
    <template #body>
      <UForm id="create-submission-form" :schema :state class="grid gap-4 lg:gap-6" :disabled="isSubmitting"
             @submit="onSubmit" @error="onError">
        <UFormField label="Type de demande" name="type" required>
          <URadioGroup v-model="state.type" :items="typeItems"
                       :orientation="$device.isDesktopOrTablet ? 'horizontal' : 'vertical'" variant="table">
            <template #label="{item}">
              <div class="flex items-center gap-2">
                {{ item.label }}
                <Icon :name="item.icon" class="size-3.5"/>
              </div>
            </template>
          </URadioGroup>
        </UFormField>

        <UFormField label="Titre" name="title" required>
          <UInput v-model="state.title" icon="i-lucide-type" class="w-full" placeholder="Titre de la demande"/>
        </UFormField>

        <UFormField label="Description" name="description">
          <UTextarea v-model="state.description" class="w-full" :rows="10"/>
        </UFormField>

        <UFormField v-if="state.type === 'file' || state.type === 'files'" label="Formats acceptés"
                    name="acceptedFormats">
          <USelectMenu v-model="state.acceptedFormats" :items="formatOptions" value-key="value" label-key="label"
                       multiple class="w-full" placeholder="Sélectionnez les formats autorisés"/>
          <template #hint>
            <span class="text-xs text-muted">Si vide, tous les formats sont acceptés (non recommandé).</span>
          </template>
        </UFormField>

        <UFormField label="Obligatoire" name="required">
          <UCheckbox v-model="state.required" label="Cette soumission est obligatoire"/>
        </UFormField>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <UFormField label="Date limite" name="deadline">
            <UInput v-model="state.deadline" type="datetime-local" icon="i-lucide-clock"
                    :min="eventDateStartParsed.format('YYYY-MM-DDTHH:mm')"
                    :max="eventDateEndParsed.format('YYYY-MM-DDTHH:mm')"/>
          </UFormField>
        </div>
      </UForm>
    </template>
    <template #footer="{close}">
      <div class="flex justify-end space-x-2">
        <UButton type="submit" form="create-submission-form" :loading="isSubmitting">Enregistrer</UButton>
        <UButton color="neutral" :disabled="isSubmitting" @click="close">Annuler</UButton>
      </div>
    </template>
  </UModal>
</template>
