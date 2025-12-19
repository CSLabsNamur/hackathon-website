<script setup lang="ts">
import * as v from "valibot";
import type { FormErrorEvent, FormSubmitEvent } from "#ui/types";
import schema from "#shared/schemas/teams/create";

const emit = defineEmits<{ close: [boolean] }>();

const dayjs = useDayjs();
const toast = useToast();
const actions = useTeamsActions();

type Schema = v.InferOutput<typeof schema>

const state = reactive<Schema>({
  name: "",
  description: "",
});

const isSubmitting = ref(false);

async function onSubmit(event: FormSubmitEvent<Schema>) {
  try {
    isSubmitting.value = true;

    await actions.createTeam(event.data);

    toast.add({
      title: "Équipe créée",
      description: "Votre équipe a été créée avec succès. Vous pouvez maintenant inviter des membres ou gérer les paramètres de votre équipe.",
      color: "success",
    });

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
  <UModal title="Créer une équipe" description="Remplissez le formulaire ci-dessous pour créer une nouvelle équipe."
          :dismissible="!isSubmitting" :close="{disabled: isSubmitting, onClick: () => emit('close', false)}"
          :ui="{content: 'max-w-2xl', footer: 'justify-end'}">
    <template #body>
      <UContainer>
        <UForm :schema :state :disabled="isSubmitting" @submit="onSubmit" @error="onError"
               class="grid grid-cols-1 lg:grid-cols-2 gap-6" id="team-creation-form">
          <UFormField label="Nom de l'équipe" name="name" required>
            <UInput v-model="state.name" icon="i-lucide-pen-line" class="w-full"/>
          </UFormField>

          <UFormField label="Idée de l'équipe" name="idea">
            <UInput v-model="state.idea" icon="i-lucide-lightbulb" class="w-full"/>
          </UFormField>

          <UFormField label="Description de l'équipe" name="description" required class="col-span-2">
            <UTextarea v-model="state.description" icon="i-lucide-info" :rows="3" class="w-full"/>
          </UFormField>
        </UForm>
      </UContainer>
    </template>
    <template #footer="{close}">
      <UButton type="submit" form="team-creation-form" :loading="isSubmitting">Soumettre</UButton>
      <UButton color="neutral" :disabled="isSubmitting" @click="close">Annuler</UButton>
    </template>
  </UModal>
</template>
