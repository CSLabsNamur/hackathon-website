<script setup lang="ts">
import * as v from "valibot";
import type { FormErrorEvent, FormSubmitEvent } from "#ui/types";
import type { Reactive } from "vue";

definePageMeta({
  layout: "user-dashboard",
});

const toast = useToast();

const schema = v.object({
  description: v.pipe(v.string(), v.minWords("fr", 1, "La description doit contenir au moins 1 mot"), v.maxLength(50, "La description est trop longue (max 50 caractères)")),
  message: v.pipe(v.string(), v.minWords("fr", 5, "Le message doit contenir au moins 5 mots"), v.maxLength(20000, "Le message est trop long (max 20000 caractères)")),
});

type Schema = v.InferOutput<typeof schema>

const state: Reactive<Schema> = reactive({
  description: "",
  message: "",
});

const isSubmitting = ref(false);

async function onSubmit(event: FormSubmitEvent<Schema>) {
  try {
    isSubmitting.value = true;
    toast.add({
      title: "Ticket envoyé",
      description: "Votre ticket a été envoyé avec succès au staff. Nous vous répondrons dans les plus brefs délais.",
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
      <DashboardNavbar title="Aide & Support"/>
    </template>
    <template #body>
      <UContainer class="pb-6 md:pb-8">
        <UCard :ui="{body: 'p-6 md:p-8'}"
               class="mx-auto max-w-4xl rounded-xl bg-white/70 dark:bg-gray-900/30 shadow-xl">
          <UForm :schema :state class="flex flex-col gap-4 lg:gap-6" @submit="onSubmit" @error="onError"
                 id="support-form">
            <UFormField label="Description du problème" name="description" required>
              <UInput v-model="state.description" icon="i-lucide-type" class="w-full"
                      placeholder="par ex. : Arrivée en retard"/>
            </UFormField>

            <UFormField label="Message" name="message" required>
              <UTextarea class="w-full" v-model="state.message" :rows="10"/>
            </UFormField>
          </UForm>

          <template #footer>
            <div class="flex justify-end">
              <UButton type="submit" form="support-form" icon="i-lucide-send" :loading="isSubmitting">
                Envoyer
              </UButton>
            </div>
          </template>
        </UCard>
      </UContainer>
    </template>
  </UDashboardPanel>
</template>
