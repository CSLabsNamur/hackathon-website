<script setup lang="ts">
import * as v from "valibot";
import type { FormErrorEvent, FormSubmitEvent } from "#ui/types";
import type { Reactive } from "vue";
import schema from "#shared/schemas/participants/create";

const toast = useToast();
const actions = useParticipantsActions();

type Schema = v.InferOutput<typeof schema>

const state: Reactive<Schema> = reactive({
  firstName: "",
  lastName: "",
  email: "",
  cautionAgreement: false,
  codeOfConduct: false,
  imageAgreement: false,
});

const isSubmitting = ref(false);

async function onSubmit(event: FormSubmitEvent<Schema>) {
  try {
    isSubmitting.value = true;

    const {curriculumVitae, ...data} = event.data;
    await actions.createParticipant(data, curriculumVitae);

    toast.add({
      title: "Inscription soumise !",
      description: "Merci pour votre inscription, nous reviendrons vers vous rapidement.",
      color: "success",
    });
    console.log(event.data);
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
  <UPageHero :ui="{container: 'max-w-full !px-0'}">
    <PageHero title="Formulaire d'inscription"
              subtitle="Remplissez le formulaire ci-dessous pour vous inscrire à l'événement. Nous reviendrons vers vous rapidement.">
    </PageHero>
  </UPageHero>

  <UContainer class="pb-6 md:pb-8">
    <UCard :ui="{body: 'p-6 md:p-8'}"
           class="mx-auto max-w-4xl rounded-xl bg-white/70 dark:bg-gray-900/30 shadow-xl">
      <template #header>
        <h2 class="text-xl md:text-2xl font-semibold">Vos informations</h2>
        <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Remplissez les champs ci‑dessous. Les champs marqués requis doivent être complétés.
        </p>
      </template>

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
          <UInput v-model="state.githubAccount" icon="i-simple-icons-github" class="w-full"/>
        </UFormField>

        <UFormField label="Compte LinkedIn" name="linkedInAccount">
          <UInput v-model="state.linkedInAccount" icon="i-simple-icons-linkedin" class="w-full"/>
        </UFormField>

        <!-- School, Diet & Needs -->
        <HybridSelectInput 
          v-model="state.school"
          label="École"
          name="school"
          :options="['UNamur', 'Henallux', 'HEAJ', 'UCLouvain', 'ULiège', 'UMons', 'ULB', 'Autre']"
          icon="i-lucide-graduation-cap"
          placeholder="Précisez votre école..."
        />
        <HybridSelectInput 
          v-model="state.diet"
          label="Régime alimentaire spécifique"
          name="diet"
          :options="['Végétarien', 'Vegan', 'Sans gluten', 'Halal', 'Kasher', 'Autre']"
          icon="i-lucide-apple"
          placeholder="Précisez votre régime alimentaire..."
        />

        <UFormField label="Besoins spécifiques" name="needs"
                    hint="(Accessibilité, etc.)">
          <UTextarea class="w-full" icon="i-lucide-heart" v-model="state.needs" :rows="1" :maxrows="3"/>
        </UFormField>

        <!-- CV Upload -->
        <UFormField class="md:col-span-2" label="Curriculum Vitae" name="curriculumVitae"
                    hint="Pourrait être rendu disponible aux partenaires de l'événement">
          <UFileUpload accept="application/pdf" hint="Déposez votre CV ici"
                       label="Déposez votre CV ici" description="PDF, max 5MB"
                       icon="i-lucide-file-user" size="sm" position="inside" layout="list"/>
        </UFormField>

        <!-- Agreements -->
        <UFormField name="caution">
          <UCheckbox v-model="state.cautionAgreement" name="caution" required
                     label="J'accepte de payer une caution de 20€ qui me sera remboursée si je participe à l'événement."/>
        </UFormField>

        <UFormField name="codeOfConduct">
          <UCheckbox v-model="state.codeOfConduct" name="codeOfConduct" required>
            <template #label>
              J'ai lu et j'accepte le
              <a href="/documents/termes_et_conditions.pdf" target="_blank" class="text-cslabs-600 underline">
                code de conduite</a>.
            </template>
          </UCheckbox>
        </UFormField>

        <UFormField name="imageAgreement">
          <UCheckbox v-model="state.imageAgreement" name="imageAgreement"
                     label="J'accepte que mon image soit utilisée dans le cadre de la promotion de l'événement (photos, vidéos, etc.)."/>
        </UFormField>

        <UFormField name="newsletter">
          <UCheckbox v-model="state.newsletter" name="newsletter"
                     label="Je souhaite recevoir la newsletter pour être informé des futurs événements."/>
        </UFormField>
      </UForm>

      <template #footer>
        <div class="flex items-start justify-between gap-8">
          <p class="text-sm text-muted">
            En soumettant ce formulaire, vous acceptez que vos données soient utilisées dans le cadre de
            l'organisation de l'événement. Vos informations ne seront pas partagées avec des tiers.
          </p>
          <UButton type="submit" form="registration-form" icon="i-lucide-send" :loading="isSubmitting">
            S'inscrire
          </UButton>
        </div>
      </template>
    </UCard>
  </UContainer>
</template>
