<script setup lang="ts">
import * as v from "valibot";
import type { Reactive } from "vue";
import type { FormErrorEvent, FormSubmitEvent } from "#ui/types";

const emit = defineEmits<{ close: [boolean] }>();

const dayjs = useDayjs();
const toast = useToast();
const {eventDateStart, eventDateEnd} = useRuntimeConfig().public;

const eventDateStartParsed = dayjs(eventDateStart);
const eventDateEndParsed = dayjs(eventDateEnd);

// TODO: Check deadline hardcoded hours
const schema = v.object({
  type: v.picklist(["text", "file", "files"]),
  title: v.pipe(v.string(), v.nonEmpty("Le titre ne peut pas être vide"), v.minWords("fr", 1, "Le titre doit contenir au moins 1 mot"), v.maxLength(50, "Le titre est trop long (max 50 caractères)")),
  description: v.optional(v.pipe(v.string(), v.minWords("fr", 3, "La description, si elle existe, doit au moins contenir 3 mots."), v.maxLength(150, "La description est trop longue (max 150 caractères)"))),
  deadline: v.pipe(v.string(), v.isoDateTime(), v.check((input) => {
    const date = dayjs(input);
    return date.isBetween(eventDateStartParsed, eventDateEndParsed);
  }, "La date doit être entre le début et la fin de l'événement.")),
  acceptedFormats: v.optional(v.string()),
  required: v.optional(v.boolean()),
});

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

    // Example payload shaping – adapt to your API as needed
    const type = event.data.type === "files" ? "file" : event.data.type;
    const payload = {
      type: type,
      title: event.data.title,
      description: event.data.description,
      deadline: dayjs(event.data.deadline).valueOf(),
      acceptedFormats: type === "file" ? event.data.acceptedFormats : undefined,
      multiple: event.data.type === "files",
      required: event.data.required ?? false,
    };

    submissionRequests.value.push({
      id: `sr_${Math.random().toString(36).substring(2, 9)}`,
      ...payload,
      createdAt: dayjs().valueOf(),
    } as SubmissionRequest)

    toast.add({
      title: "Demande de soumission créée",
      description: "La nouvelle demande de soumission a été créée avec succès.",
      color: "success",
    });

    // For now, log the payload
    console.log(payload);

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
                       :orientation="isLargeScreen ? 'horizontal' : 'vertical'" variant="table">
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
