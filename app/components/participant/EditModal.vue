<script setup lang="ts">
import type { FormErrorEvent, FormSubmitEvent } from "#ui/types";
import type { Reactive } from "vue";
import { default as schema, type EditParticipantSchema } from "#shared/schemas/participants/edit";

const props = defineProps<{ participant: Participant, adminEdit?: boolean }>();
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
          :close="{onClick: () => emit('close', false)}" :ui="{content: 'max-w-2xl'}">
    <template #body>
      <!-- TODO: Put form in a separate component and use it in registration as well -->
      <UForm :schema="schema" :state class="grid grid-cols-1 md:grid-cols-2 gap-6" @submit="onSubmit" @error="onError"
             id="participant-edit-form">
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
        <UFormField label="École" name="school">
          <USelect v-model="state.school"
                   class="w-full"
                   :items="['UNamur', 'Henallux', 'HEAJ', 'UCLouvain', 'ULiège', 'UMons', 'ULB', 'Hors Belgique', 'Autre']"
                   icon="i-lucide-graduation-cap">
            <template #trailing>
              <UButton v-if="state.school" aria-label="Effacer la sélection"
                       icon="i-lucide-x" color="neutral" size="xs" variant="ghost"
                       @pointerdown.stop.prevent
                       @keydown.enter.stop.prevent="state.school = undefined"
                       @keydown.space.stop.prevent="state.school = undefined"
                       @click.stop="state.school = undefined"
                       class="text-muted"/>
            </template>
          </USelect>
        </UFormField>

        <UFormField label="Régime alimentaire spécifique" name="diet">
          <USelect v-model="state.diet"
                   class="w-full"
                   :items="['Végétarien', 'Vegan', 'Sans gluten', 'Halal', 'Kasher', 'Autre']"
                   icon="i-lucide-apple">
            <template #trailing>
              <UButton v-if="state.diet" aria-label="Effacer la sélection"
                       icon="i-lucide-x" color="neutral" size="xs" variant="ghost"
                       @pointerdown.stop.prevent
                       @keydown.enter.stop.prevent="state.diet = undefined"
                       @keydown.space.stop.prevent="state.diet = undefined"
                       @click.stop="state.diet = undefined"
                       class="text-muted"/>
            </template>
          </USelect>
        </UFormField>

        <UFormField label="Besoins spécifiques" name="needs">
          <UTextarea class="w-full" v-model="state.needs" :rows="1" :maxrows="3"/>
        </UFormField>

        <!-- CV -->
        <!--        <UFormField class="md:col-span-2" label="Curriculum Vitae" name="curriculumVitae">-->
        <!--          <UCheckbox label="Supprimer le CV" v-model="state.curriculumVitae"/>-->
        <!--        </UFormField>-->
      </UForm>
    </template>
    <template #footer>
      <div class="flex justify-end gap-3">
        <UButton type="submit" form="participant-edit-form" :loading="isSubmitting">Enregistrer</UButton>
        <UButton color="neutral" @click="emit('close', false)">Annuler</UButton>
      </div>
    </template>
  </UModal>
</template>
