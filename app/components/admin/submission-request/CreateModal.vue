<script setup lang="ts">
import * as v from "valibot";
import type { Reactive } from "vue";
import type { FormErrorEvent, FormSubmitEvent } from "#ui/types";
import { createSubmissionRequestSchema } from "#shared/schemas/submissions/requests/create";

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

const isSubmitting = ref(false);

async function onSubmit(event: FormSubmitEvent<Schema>) {
  try {
    isSubmitting.value = true;

    await createSubmissionRequest(event.data);

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
  <UModal :close="{onClick: () => emit('close', false)}" title="Nouvelle demande de soumission"
          :ui="{content: 'max-w-xl'}">
    <template #body>
      <UForm :schema :state class="grid gap-4 lg:gap-6" @submit="onSubmit" @error="onError"
             id="create-submission-form">
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
          <UTextarea class="w-full" v-model="state.description" :rows="10"/>
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
        <UButton type="submit" form="create-submission-form">Enregistrer</UButton>
        <UButton color="neutral" @click="close">Annuler</UButton>
      </div>
    </template>
  </UModal>
</template>
