<script setup lang="ts">
import * as v from "valibot";
import type { FormErrorEvent, FormSubmitEvent } from "#ui/types";

const emit = defineEmits<{ close: [boolean] }>();

const dayjs = useDayjs();
const toast = useToast();

const schema = v.object({
  name: v.pipe(v.string(), v.nonEmpty("Le nom de l'équipe est requis"), v.minLength(3, "Le nom de l'équipe doit contenir au moins 3 caractères"), v.maxLength(30, "Le nom de l'équipe ne peut pas dépasser 30 caractères")),
  description: v.optional(v.pipe(v.string(), v.maxLength(250, "La description de l'équipe ne peut pas dépasser 250 caractères"))),
  idea: v.optional(v.pipe(v.string(), v.maxLength(100, "L'idée de l'équipe ne peut pas dépasser 100 caractères"))),
});

type Schema = v.InferOutput<typeof schema>

const state = reactive<Schema>({
  name: "",
});

const isSubmitting = ref(false);

async function onSubmit(event: FormSubmitEvent<Schema>) {
  try {
    isSubmitting.value = true;

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    toast.add({
      title: "Équipe créée",
      description: "Votre équipe a été créée avec succès. Vous pouvez maintenant inviter des membres ou gérer les paramètres de votre équipe.",
      color: "success",
    });

    const newTeam = {
      id: Math.random().toString(36).substring(2, 9),
      name: event.data.name,
      description: event.data.description,
      idea: event.data.idea,
      members: [currentParticipant.id],
      token: Math.random().toString(36).substring(2, 15),
      createdAt: dayjs().valueOf(),
    };
    teams.push(newTeam);
    currentParticipant.team = newTeam.id;

    console.log(event.data);
    emit("close", true);
  } finally {
    isSubmitting.value = false;
  }
}

// TODO: move to utils
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

          <UFormField label="Description de l'équipe" name="description" class="col-span-2">
            <UTextarea v-model="state.description" icon="i-lucide-info" :rows="3" class="w-full"/>
          </UFormField>
        </UForm>
      </UContainer>
    </template>
    <template #footer="{close}">
      <UButton type="submit" form="team-creation-form" :loading="isSubmitting">Soumettre</UButton>
      <UButton color="neutral" @click="close">Annuler</UButton>
    </template>
  </UModal>
</template>
