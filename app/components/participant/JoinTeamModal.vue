<script setup lang="ts">
import * as v from "valibot";
import type { FormErrorEvent, FormSubmitEvent } from "#ui/types";

const emit = defineEmits<{ close: [boolean] }>();

const toast = useToast();

// TODO: use UUID when not using mock data anymore
const schema = v.object({
  token: v.pipe(v.string(), v.nonEmpty("Le token est requis"), v.minLength(12, "Le token doit contenir au moins 12 caractères")),
});

type Schema = v.InferOutput<typeof schema>

const state = reactive<Schema>({
  token: "",
});

const isSubmitting = ref(false);

async function onSubmit(event: FormSubmitEvent<Schema>) {
  try {
    isSubmitting.value = true;
    const team = teams.find(t => t.token === event.data.token);
    if (team) {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      currentParticipant.team = team.id;
      team.members.push(currentParticipant.id);

      toast.add({
        title: "Équipe rejointe !",
        description: "Vous avez rejoint l'équipe avec succès. Vous pouvez maintenant collaborer avec vos coéquipiers.",
        color: "success",
      });

      emit("close", true);
    } else {
      toast.add({
        title: "Erreur",
        description: "Le token fourni est invalide. Veuillez vérifier et réessayer.",
        color: "error",
      });
    }

    console.log(event.data);
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
  <UModal title="Rejoindre une équipe" description="Entrez le token de l'équipe que vous souhaitez rejoindre."
          :dismissible="!isSubmitting" :close="{disabled: isSubmitting, onClick: () => emit('close', false)}"
          :ui="{content: 'max-w-2xl', footer: 'justify-end'}">
    <template #body>
      <UContainer>
        <UForm :schema :state :disabled="isSubmitting" @submit="onSubmit" @error="onError" id="team-join-form">
          <UFormField label="Token" name="token" required>
            <UInput v-model="state.token" icon="i-lucide-braces" class="w-full"/>
          </UFormField>
        </UForm>
      </UContainer>
    </template>
    <template #footer="{close}">
      <UButton color="neutral" @click="close">Annuler</UButton>
      <UButton type="submit" form="team-join-form" :loading="isSubmitting">Soumettre</UButton>
    </template>
  </UModal>
</template>
