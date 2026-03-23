<script setup lang="ts">
import type * as v from "valibot";
import type { Reactive } from "vue";
import type { FormErrorEvent, FormSubmitEvent } from "#ui/types";
import { GuestType } from "#shared/utils/types";
import schema from "#shared/schemas/guests/create";
import { guestTypeItems } from "./constants";

const emit = defineEmits<{ close: [boolean] }>();

const toast = useToast();
const {createGuest} = useGuestsActions();

type Schema = v.InferOutput<typeof schema>

const state: Reactive<Schema> = reactive({
  name: "",
  type: GuestType.GUEST,
  company: undefined,
  imageUrl: undefined,
});

const isSubmitting = ref(false);

async function onSubmit(event: FormSubmitEvent<Schema>) {
  try {
    isSubmitting.value = true;

    await createGuest({
      ...event.data,
      company: event.data.company,
      imageUrl: event.data.imageUrl,
    });

    toast.add({
      title: "Invité ajouté",
      description: "L'invité a été ajouté avec succès.",
      color: "success",
    });

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
  <UModal title="Ajouter un invité"
          description="Ajoutez une personne invitée à l'événement pour le suivi et la génération des badges."
          :dismissible="!isSubmitting" :close="{disabled: isSubmitting, onClick: () => emit('close', false)}"
          :ui="{content: 'max-w-2xl', footer: 'justify-end'}">
    <template #body>
      <UContainer>
        <UForm id="guest-create-form" :schema :state :disabled="isSubmitting"
               class="grid grid-cols-1 md:grid-cols-2 gap-6"
               @submit="onSubmit" @error="onError">
          <UFormField label="Nom" name="name" required>
            <UInput v-model="state.name" icon="i-lucide-user" class="w-full" placeholder="Nom"/>
          </UFormField>

          <UFormField label="Entreprise" name="company">
            <UInput v-model="state.company" icon="i-lucide-building-2" class="w-full"
                    placeholder="Entreprise / Organisation"/>
          </UFormField>

          <UFormField label="Type" name="type" required class="md:col-span-2">
            <URadioGroup v-model="state.type" :items="guestTypeItems" orientation="vertical" variant="table">
              <template #label="{item}">
                <div class="flex items-center gap-2">
                  <Icon :name="item.icon" class="size-3.5"/>
                  {{ item.label }}
                </div>
              </template>
            </URadioGroup>
          </UFormField>

          <UFormField label="Image / Logo" name="imageUrl" class="md:col-span-2"
                      description="URL facultative de la photo ou du logo utilisé pour l'identification.">
            <UInput v-model="state.imageUrl" type="url" icon="i-lucide-image" class="w-full"
                    placeholder="https://..."/>
          </UFormField>
        </UForm>
      </UContainer>
    </template>

    <template #footer="{close}">
      <UButton type="submit" form="guest-create-form" :loading="isSubmitting">Ajouter</UButton>
      <UButton color="neutral" :disabled="isSubmitting" @click="close">Annuler</UButton>
    </template>
  </UModal>
</template>
