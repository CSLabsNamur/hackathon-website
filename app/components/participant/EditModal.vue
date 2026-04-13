<script setup lang="ts">
import type { FormErrorEvent, FormSubmitEvent } from "#ui/types";
import type { Reactive } from "vue";
import { default as schema, type EditParticipantSchema } from "#shared/schemas/participants/edit";

const props = defineProps<{ participant: CurrentParticipant | AdminParticipant, adminEdit?: boolean }>();
const emit = defineEmits<{ close: [boolean] }>();

const toast = useToast();

const state: Reactive<EditParticipantSchema> = reactive({
  firstName: props.participant.user.firstName,
  lastName: props.participant.user.lastName,
  email: props.participant.user.email,
  githubAccount: props.participant.githubAccount || undefined,
  linkedInAccount: props.participant.linkedInAccount || undefined,
  school: props.participant.school || undefined,
  diet: props.participant.diet || undefined,
  needs: props.participant.needs || undefined,
  // TODO: implement CV upload/removal
  //curriculumVitae: false,
});

const isSubmitting = ref(false);

async function onSubmit(event: FormSubmitEvent<EditParticipantSchema>) {
  try {
    isSubmitting.value = true;

    if (props.adminEdit) {
      const actions = useParticipantsActions();
      await actions.updateParticipant(props.participant.id, event.data);
    } else {
      const actions = useCurrentParticipantActions();
      await actions.updateParticipant(event.data);
    }

    toast.add({
      title: props.adminEdit ? "Participant modifié" : "Profil mis à jour",
      description: props.adminEdit ? "Le participant a été modifié avec succès." : "Vos informations ont été modifiées avec succès.",
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
  <UModal :title="adminEdit ? 'Modifier le participant' : 'Modifier mon profil'"
          :description="adminEdit ? `Modifier les informations de ${participant.user.firstName} ${participant.user.lastName}` : 'Modifiez les informations de votre profil'"
          :dismissible="!isSubmitting" :close="{disabled: isSubmitting, onClick: () => emit('close', false)}"
          :ui="{content: 'max-w-2xl', footer: 'justify-end'}">
    <template #body>
      <!-- TODO: Put form in a separate component and use it in registration as well -->
      <UForm id="participant-edit-form" :schema="schema" :state class="grid grid-cols-1 md:grid-cols-2 gap-6"
             :disabled="isSubmitting" @submit="onSubmit" @error="onError">
        <!-- First & Last name -->
        <UFormField label="Prénom" name="firstName" required>
          <UInput v-model="state.firstName" icon="i-lucide-user" class="w-full"/>
        </UFormField>

        <UFormField label="Nom" name="lastName" required>
          <UInput v-model="state.lastName" icon="i-lucide-user" class="w-full"/>
        </UFormField>

        <!-- Email -->
        <UFormField label="Email" name="email" type="email" required>
          <UInput v-model="state.email" icon="i-lucide-at-sign" class="w-full"/>
        </UFormField>

        <!-- Socials -->
        <UFormField label="Compte GitHub" name="githubAccount">
          <UInput v-model="state.githubAccount" icon="i-simple-icons-github" class="w-full"/>
        </UFormField>

        <UFormField label="Compte LinkedIn" name="linkedInAccount">
          <UInput v-model="state.linkedInAccount" icon="i-simple-icons-linkedin" class="w-full"/>
        </UFormField>

        <!-- School, Diet & Needs -->
        <HybridSelectInput v-model="state.school" label="École" name="school"
                           :options="['UNamur', 'Henallux', 'HEAJ', 'UCLouvain', 'ULiège', 'UMons', 'ULB', 'Autre']"
                           icon="i-lucide-graduation-cap" placeholder="Précisez votre école..."/>
        <HybridSelectInput v-model="state.diet" label="Régime alimentaire spécifique" name="diet"
                           :options="['Végétarien', 'Vegan', 'Sans gluten', 'Halal', 'Kasher', 'Autre']"
                           icon="i-lucide-apple" placeholder="Précisez votre régime alimentaire..."/>

        <UFormField label="Besoins spécifiques" name="needs">
          <UTextarea v-model="state.needs" class="w-full" :rows="1" :maxrows="3"/>
        </UFormField>

        <!-- CV -->
        <!--        <UFormField class="md:col-span-2" label="Curriculum Vitae" name="curriculumVitae">-->
        <!--          <UCheckbox label="Supprimer le CV" v-model="state.curriculumVitae"/>-->
        <!--        </UFormField>-->
      </UForm>
    </template>
    <template #footer="{close}">
      <UButton type="submit" form="participant-edit-form" :loading="isSubmitting">Enregistrer</UButton>
      <UButton color="neutral" :disabled="isSubmitting" @click="close">Annuler</UButton>
    </template>
  </UModal>
</template>
