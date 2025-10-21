<script setup lang="ts">
import * as v from "valibot";
import type { FormErrorEvent, FormSubmitEvent } from "#ui/types";
import type { Reactive } from "vue";

const props = defineProps<{ participant: Participant }>();
const emit = defineEmits<{ close: [boolean] }>();

const toast = useToast();

const schema = v.object({
  firstName: v.pipe(v.string(), v.nonEmpty("Le prénom est requis")),
  lastName: v.pipe(v.string(), v.nonEmpty("Le nom est requis")),
  email: v.pipe(v.string(), v.nonEmpty("L'email est requis"), v.email("L'email n'est pas valide")),
  githubAccount: v.optional(v.pipe(v.string(), v.url("Le lien n'est pas valide"), v.includes("github.com", "Le lien n'est pas un lien GitHub"))),
  linkedinAccount: v.optional(v.pipe(v.string(), v.url("Le lien n'est pas valide"), v.includes("linkedin.com", "Le lien n'est pas un lien LinkedIn"))),
  school: v.optional(v.picklist(["UNamur", "Henallux", "HEAJ", "UCLouvain", "ULiège", "UMons", "ULB", "Hors Belgique", "Autre"], "Le choix n'est pas valide")),
  diet: v.optional(v.picklist(["Végétarien", "Vegan", "Sans gluten", "Halal", "Kasher", "Autre"], "Le choix n'est pas valide")),
  needs: v.optional(v.string()),
  curriculumVitae: v.boolean(),
});

type Schema = v.InferOutput<typeof schema>

const state: Reactive<Schema> = reactive({
  firstName: props.participant.firstName,
  lastName: props.participant.lastName,
  email: props.participant.email,
  githubAccount: props.participant.githubAccount || undefined,
  linkedinAccount: props.participant.linkedinAccount || undefined,
  school: props.participant.school || undefined,
  diet: props.participant.diet || undefined,
  needs: props.participant.needs || undefined,
  curriculumVitae: false,
});

const isSubmitting = ref(false);

async function onSubmit(event: FormSubmitEvent<Schema>) {
  try {
    isSubmitting.value = true;
    toast.add({
      title: "Participant modifié",
      description: "Le participant a été modifié avec succès.",
      color: "success",
    });
    // Update user in the mock list
    participants.find(u => u.id === props.participant.id)!.firstName = event.data.firstName;
    participants.find(u => u.id === props.participant.id)!.lastName = event.data.lastName;
    participants.find(u => u.id === props.participant.id)!.email = event.data.email;
    participants.find(u => u.id === props.participant.id)!.githubAccount = event.data.githubAccount || null;
    participants.find(u => u.id === props.participant.id)!.linkedinAccount = event.data.linkedinAccount || null;
    participants.find(u => u.id === props.participant.id)!.school = event.data.school || null;
    participants.find(u => u.id === props.participant.id)!.diet = event.data.diet || null;
    participants.find(u => u.id === props.participant.id)!.needs = event.data.needs || null;
    if (event.data.curriculumVitae) {
      participants.find(u => u.id === props.participant.id)!.curriculumVitae = null;
    }
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
  <UModal :close="{onClick: () => emit('close', false)}" title="Modifier l'utilisateur"
          :description="`Modifier les informations de ${participant.firstName} ${participant.lastName}`"
          :ui="{content: 'max-w-2xl'}">
    <template #body>
      <UForm :schema :state class="grid grid-cols-1 md:grid-cols-2 gap-6" @submit="onSubmit" @error="onError"
             id="registration-form">
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
          <UInput v-model="state.githubAccount" placeholder="https://github.com/votre-compte"
                  icon="i-simple-icons-github" class="w-full"/>
        </UFormField>

        <UFormField label="Compte LinkedIn" name="linkedinAccount">
          <UInput v-model="state.linkedinAccount" placeholder="https://linkedin.com/in/votre-compte"
                  icon="i-simple-icons-linkedin" class="w-full"/>
        </UFormField>

        <!-- School, Diet & Needs -->
        <UFormField label="École" name="school">
          <USelect v-model="state.school"
                   class="w-full"
                   :items="['UNamur', 'Henallux', 'HEAJ', 'UCLouvain', 'ULiège', 'UMons', 'ULB', 'Hors Belgique', 'Autre']"
                   icon="i-lucide-graduation-cap"
                   placeholder="Sélectionnez votre école">
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
                   icon="i-lucide-apple"
                   placeholder="Sélectionnez votre régime alimentaire">
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
        <UFormField class="md:col-span-2" label="Curriculum Vitae" name="curriculumVitae">
          <UCheckbox label="Supprimer le CV" v-model="state.curriculumVitae"/>
        </UFormField>
      </UForm>
    </template>
    <template #footer>
      <div class="flex justify-end space-x-2">
        <UButton color="neutral" @click="emit('close', false)">Annuler</UButton>
        <UButton type="submit" form="registration-form" :loading="isSubmitting">Enregistrer</UButton>
      </div>
    </template>
  </UModal>
</template>
