<script setup lang="ts">
import * as v from "valibot";
import type { FormErrorEvent, FormSubmitEvent } from "#ui/types";
import schema from "~~/shared/schemas/teams/join";

const emit = defineEmits<{ close: [boolean] }>();

const toast = useToast();
const actions = useTeamsActions();

type Schema = v.InferOutput<typeof schema>

const state = reactive<Schema>({
  token: "",
});

const isSubmitting = ref(false);

async function onSubmit(event: FormSubmitEvent<Schema>) {
  try {
    isSubmitting.value = true;

    await actions.joinTeam(event.data.token);

    toast.add({
      title: "Équipe rejointe !",
      description: "Vous avez rejoint l'équipe avec succès. Vous pouvez maintenant collaborer avec vos coéquipiers.",
      color: "success",
    });

    emit("close", true);
    console.log(event.data);
  } catch (error) {
    // TODO: handle other errors
    toast.add({
      title: "Erreur",
      description: "Le token fourni est invalide. Veuillez vérifier et réessayer.",
      color: "error",
    });
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
      <UButton type="submit" form="team-join-form" :loading="isSubmitting">Soumettre</UButton>
      <UButton color="neutral" :disabled="isSubmitting" @click="close">Annuler</UButton>
    </template>
  </UModal>
</template>
