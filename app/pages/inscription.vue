<script setup lang="ts">
import * as v from "valibot";
import type { FormErrorEvent, FormSubmitEvent } from "#ui/types";
import type { Reactive } from "vue";

const toast = useToast();

const schema = v.pipe(
    v.object({
      firstName: v.pipe(v.string(), v.nonEmpty("Le prénom est requis")),
      lastName: v.pipe(v.string(), v.nonEmpty("Le nom est requis")),
      password: v.pipe(v.string(), v.minLength(8, "Le mot de passe doit contenir au moins 8 caractères"), v.regex(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/, "Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial")),
      passwordConfirm: v.string(),
      email: v.pipe(v.string(), v.nonEmpty("L'email est requis"), v.email("L'email n'est pas valide")),
      githubAccount: v.optional(v.pipe(v.string(), v.url("Le lien n'est pas valide"), v.includes("github.com", "Le lien n'est pas un lien GitHub"))),
      linkedinAccount: v.optional(v.pipe(v.string(), v.url("Le lien n'est pas valide"), v.includes("linkedin.com", "Le lien n'est pas un lien LinkedIn"))),
      school: v.optional(v.picklist(["UNamur", "Henallux", "HEAJ", "UCLouvain", "ULiège", "UMons", "ULB", "Hors Belgique", "Autre"], "Le choix n'est pas valide")),
      diet: v.optional(v.picklist(["Végétarien", "Vegan", "Sans gluten", "Halal", "Kasher", "Autre"], "Le choix n'est pas valide")),
      needs: v.optional(v.string()),
      curriculumVitae: v.optional(v.pipe(v.file(), v.mimeType(["application/pdf"], "Veuillez sélectionner un fichier PDF."), v.maxSize(1024 * 1024 * 5, "Le fichier est trop volumineux (max 5MB)"))),
      caution: v.pipe(v.boolean(), v.value(true, "Vous devez accepter de payer la caution pour vous inscrire")),
      codeOfConduct: v.pipe(v.boolean(), v.value(true, "Vous devez accepter le code de conduite pour vous inscrire")),
      imageAgreement: v.optional(v.boolean(), false),
      newsletter: v.optional(v.boolean()),
    }),
    v.forward(
        v.partialCheck(
            [["password"], ["passwordConfirm"]],
            (input) => input.password === input.passwordConfirm,
            "Les mots de passe ne correspondent pas",
        ),
        ["passwordConfirm"],
    ),
);

type Schema = v.InferOutput<typeof schema>

const state: Reactive<Schema> = reactive({
  firstName: "",
  lastName: "",
  password: "",
  passwordConfirm: "",
  email: "",
  caution: false,
  codeOfConduct: false,
  imageAgreement: false,
});

const isSubmitting = ref(false);

async function onSubmit(event: FormSubmitEvent<Schema>) {
  try {
    isSubmitting.value = true;
    toast.add({
      title: "Inscription soumise !",
      description: "Merci pour votre inscription, nous reviendrons vers vous rapidement.",
      color: "success",
    });
    await $fetch("/api/back/authentication/register", {
      method: "POST",
      body: event.data,
    });
    if (event.data.curriculumVitae) {
      const formData = new FormData();
      formData.append("file", event.data.curriculumVitae);
      await $fetch("/api/back/users/me/curriculum-vitae", {
        method: "POST",
        body: formData,
      });
    }
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
    <PageHero title="Formulaire d'inscription" subtitle="Très bonne idée !"
              content="Remplissez le formulaire ci-dessous pour vous inscrire à l'événement. Nous reviendrons vers vous rapidement.">
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

        <!-- Password & Confirm Password -->
        <UFormField label="Mot de passe" name="password" required>
          <UInput v-model="state.password" icon="i-lucide-lock" type="password" class="w-full"/>
        </UFormField>

        <UFormField label="Confirmer le mot de passe" name="passwordConfirm" required>
          <UInput v-model="state.passwordConfirm" icon="i-lucide-lock" type="password" class="w-full"/>
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

        <UFormField label="Besoins spécifiques" name="needs"
                    hint="(Accessibilité, etc.)">
          <UTextarea class="w-full" v-model="state.needs" :rows="1" :maxrows="3"/>
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
          <UCheckbox v-model="state.caution" name="caution" required
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
