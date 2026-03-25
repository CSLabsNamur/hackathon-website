<script setup lang="ts">
import type * as v from "valibot";
import type { Reactive } from "vue";
import type { FormErrorEvent, FormSubmitEvent } from "#ui/types";
import schema from "#shared/schemas/guests/edit";

const props = defineProps<{ guest: Guest }>();
const emit = defineEmits<{ close: [boolean] }>();

const toast = useToast();
const {updateGuest} = useGuestsActions();

type Schema = v.InferOutput<typeof schema>

const guestImageAccept = acceptedFormatsToHtmlAccept(ACCEPTED_GUEST_IMAGE_EXTS);
const guestImageFormatsLabel = acceptedFormatsToLabel(ACCEPTED_GUEST_IMAGE_EXTS)!.toUpperCase();
const guestImageDescription = `${guestImageFormatsLabel}, max 5MB`;

const state: Reactive<Schema> = reactive({
  name: props.guest.quantity > 1 ? "" : props.guest.name,
  type: props.guest.type,
  quantity: props.guest.quantity > 1 ? props.guest.quantity : undefined,
  company: props.guest.company || undefined,
  imageFile: undefined,
});

const hasExplicitName = computed(() => !!state.name.trim());
const isSubmitting = ref(false);

watch(toRef(state.name), (name) => {
  if (name.trim()) {
    state.quantity = undefined;
  }
});

async function onSubmit(event: FormSubmitEvent<Schema>) {
  try {
    isSubmitting.value = true;

    await updateGuest(props.guest.id, event.data);

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
          <UFormField label="Nom" name="name" description="Laissez vide pour utiliser le type d'invité.">
            <UInput v-model="state.name" icon="i-lucide-user" class="w-full"/>
          </UFormField>

          <UFormField v-if="!hasExplicitName" label="Nombre de badges" name="quantity"
                      description="Pour créer plusieurs badges anonymes du même type">
            <UInputNumber v-model="state.quantity" :min="1" variant="soft" class="w-full"/>
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

          <UFormField label="Image / Logo" name="imageFile" class="md:col-span-2"
                      description="Laissez vide pour conserver l'image actuelle.">
            <UFileUpload v-model="state.imageFile" :accept="guestImageAccept" hint="Déposez une nouvelle image ici"
                         label="Déposez une nouvelle image ici" :description="guestImageDescription"
                         icon="i-lucide-image-up" size="sm" position="inside" layout="list"/>

            <div v-if="guest.imageUrl" class="mt-4 flex items-center gap-4">
              <img :src="guest.imageUrl" :alt="`Image de ${guest.name}`"
                   class="max-h-20 max-w-32 rounded object-contain bg-default p-2">
              <UButton :to="guest.imageUrl" target="_blank" external variant="link" icon="i-lucide-image">
                Voir l'image actuelle
              </UButton>
            </div>
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
