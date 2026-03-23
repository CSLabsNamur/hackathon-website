<script setup lang="ts">
import type * as v from "valibot";
import type { Reactive } from "vue";
import type { FormErrorEvent, FormSubmitEvent } from "#ui/types";
import type { Guest } from "#shared/utils/types";
import schema from "#shared/schemas/guests/edit";
import { guestTypeItems } from "./constants";

const props = defineProps<{ guest: Guest }>();
const emit = defineEmits<{ close: [boolean] }>();

const toast = useToast();
const {updateGuest} = useGuestsActions();

type Schema = v.InferOutput<typeof schema>

const state: Reactive<Schema> = reactive({
  name: props.guest.name,
  type: props.guest.type,
  company: props.guest.company || undefined,
  imageUrl: props.guest.imageUrl || undefined,
});

const isSubmitting = ref(false);

async function onSubmit(event: FormSubmitEvent<Schema>) {
  try {
    isSubmitting.value = true;

    await updateGuest(props.guest.id, {
      ...event.data,
      company: event.data.company,
      imageUrl: event.data.imageUrl,
    });

    toast.add({
      title: "Invité modifié",
      description: "L'invité a été modifié avec succès.",
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
  <UModal title="Modifier l'invité"
          :description="`Modifier les informations de ${guest.name}`"
          :dismissible="!isSubmitting" :close="{disabled: isSubmitting, onClick: () => emit('close', false)}"
          :ui="{content: 'max-w-2xl', footer: 'justify-end'}">
    <template #body>
      <UContainer>
        <UForm id="guest-edit-form" :schema :state :disabled="isSubmitting"
               class="grid grid-cols-1 md:grid-cols-2 gap-6"
               @submit="onSubmit" @error="onError">
          <UFormField label="Nom" name="name" required>
            <UInput v-model="state.name" icon="i-lucide-user" class="w-full"/>
          </UFormField>

          <UFormField label="Structure" name="company">
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
      <UButton type="submit" form="guest-edit-form" :loading="isSubmitting">Enregistrer</UButton>
      <UButton color="neutral" :disabled="isSubmitting" @click="close">Annuler</UButton>
    </template>
  </UModal>
</template>
