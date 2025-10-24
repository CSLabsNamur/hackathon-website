<script setup lang="ts">
import * as v from "valibot";
import type { FormErrorEvent, FormSubmitEvent } from "#ui/types";
import type { Reactive } from "vue";

definePageMeta({
  layout: "dashboard",
});

const toast = useToast();

const schema = v.object({
  recipients: v.picklist(["Participants", "Organisateurs", "Formations", "Tous"]),
  title: v.pipe(v.string(), v.minWords("fr", 1, "Le titre doit contenir au moins 1 mot"), v.maxLength(250, "Le titre est trop long (max 250 caractères)")),
  message: v.pipe(v.string(), v.minWords("fr", 5, "Le message doit contenir au moins 5 mots"), v.maxLength(20000, "Le message est trop long (max 20000 caractères)")),
  attachments: v.optional(v.pipe(v.array(v.pipe(v.file(), v.maxSize(1024 * 1024 * 5, "Le fichier est trop volumineux (max 5MB)"))), v.maxLength(10, "Vous ne pouvez pas télécharger plus de 10 fichiers"))),
});

type Schema = v.InferOutput<typeof schema>

const state: Reactive<Schema> = reactive({
  recipients: "Participants",
  title: "",
  message: "",
});

const recipientsItems = [{
  label: "Participants",
  value: "Participants",
  icon: "i-lucide-users",
}, {
  label: "Organisateurs",
  value: "Organisateurs",
  icon: "i-lucide-shield-check",
}, {
  label: "Formations",
  value: "Formations",
  icon: "i-lucide-book-open",
}, {
  label: "Tous",
  value: "Tous",
  icon: "i-lucide-globe",
}];

const isSubmitting = ref(false);

async function onSubmit(event: FormSubmitEvent<Schema>) {
  try {
    isSubmitting.value = true;
    toast.add({
      title: "Annonce envoyée",
      description: "L'annonce a été envoyée avec succès.",
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
  <UDashboardPanel>
    <template #header>
      <DashboardNavbar title="Annonce"/>
    </template>
    <template #body>
      <UContainer class="pb-6 md:pb-8">
        <UCard :ui="{body: 'p-6 md:p-8'}"
               class="mx-auto max-w-4xl rounded-xl bg-white/70 dark:bg-gray-900/30 shadow-xl">
          <UForm :schema :state class="flex flex-col gap-4 lg:gap-6" @submit="onSubmit" @error="onError"
                 id="broadcast-form">
            <UFormField label="Destinataires" name="recipients" required>
              <URadioGroup v-model="state.recipients" :items="recipientsItems"
                           :orientation="isLargeScreen ? 'horizontal' : 'vertical'" variant="table">
                <template #label="{item}">
                  <div class="flex justify-center items-center gap-2">
                    {{ item.label }}
                    <Icon :name="item.icon" class="size-3.5"/>
                  </div>
                </template>
              </URadioGroup>
            </UFormField>

            <UFormField label="Titre" name="title" required>
              <UInput v-model="state.title" icon="i-lucide-type" class="w-full" placeholder="Titre de l'annonce"/>
            </UFormField>

            <UFormField label="Message" name="message" required>
              <UTextarea class="w-full" v-model="state.message" :rows="10"/>
            </UFormField>

            <UFormField label="Pièce(s) jointe(s)" name="attachments">
              <UFileUpload label="Déposez vos fichiers ici" description="Max 5MB chacun" multiple
                           icon="i-lucide-file-user" size="sm" position="inside" layout="list"
                           v-model="state.attachments"/>
            </UFormField>
          </UForm>

          <template #footer>
            <div class="flex justify-end">
              <UButton type="submit" form="broadcast-form" icon="i-lucide-send" :loading="isSubmitting">
                Envoyer
              </UButton>
            </div>
          </template>
        </UCard>
      </UContainer>
    </template>
  </UDashboardPanel>
</template>
