<script setup lang="ts">
import type * as v from "valibot";
import type { FormErrorEvent, FormSubmitEvent } from "#ui/types";
import schema from "#shared/schemas/sponsors/create";
import type { Reactive } from "vue";

const emit = defineEmits<{ close: [boolean] }>();

const toast = useToast();
const {createSponsor} = useSponsorsActions();

type Schema = v.InferOutput<typeof schema>
type State = Omit<Schema, "logoFile"> & { logoFile?: Schema["logoFile"] }

const sponsorLogoAccept = acceptedFormatsToHtmlAccept(ACCEPTED_SPONSOR_LOGO_EXTS);
const sponsorLogoFormatsLabel = acceptedFormatsToLabel(ACCEPTED_SPONSOR_LOGO_EXTS)?.toUpperCase() ?? "PNG, JPG, JPEG, WEBP";
const sponsorLogoDescription = `${sponsorLogoFormatsLabel}, max 5MB`;

const state: Reactive<State> = reactive({
  name: "",
  description: createEmptyRichTextDocument(),
  logoFile: undefined,
  url: "",
  hasBadge: false,
});

const isSubmitting = ref(false);

async function onSubmit(event: FormSubmitEvent<Schema>) {
  try {
    isSubmitting.value = true;

    await createSponsor(event.data);

    toast.add({
      title: "Sponsor ajouté",
      description: "Le sponsor a été ajouté avec succès.",
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
  <UModal title="Ajouter un sponsor" description="Ajoutez un sponsor de l'évènement."
          :dismissible="!isSubmitting" :close="{disabled: isSubmitting, onClick: () => emit('close', false)}"
          :ui="{content: 'max-w-4xl', footer: 'justify-end'}">
    <template #body>
      <UContainer>
        <UForm id="sponsor-create-form" :schema :state :disabled="isSubmitting"
               class="grid grid-cols-1 md:grid-cols-2 gap-6"
               @submit="onSubmit" @error="onError">
          <UFormField label="Nom" name="name" required>
            <UInput v-model="state.name" icon="i-lucide-building-2" class="w-full"/>
          </UFormField>

          <UFormField label="Site web" name="url" required>
            <UInput v-model="state.url" type="url" icon="i-lucide-link" class="w-full"
                    placeholder="https://..."/>
          </UFormField>

          <UFormField class="md:col-span-2" label="Logo" name="logoFile" required>
            <UFileUpload v-model="state.logoFile" :accept="sponsorLogoAccept"
                         hint="Déposez le logo ici" label="Déposez le logo ici" :description="sponsorLogoDescription"
                         icon="i-lucide-image-up" size="sm" position="inside" layout="list"/>
          </UFormField>

          <UFormField name="hasBadge" class="md:col-span-2">
            <UCheckbox v-model="state.hasBadge" label="Prévoir un badge pour ce sponsor"/>
          </UFormField>

          <UFormField label="Description" name="description" class="md:col-span-2"
                      description="Texte affiché sur la page partenaires">
            <UEditor v-slot="{ editor }" v-model="state.description" content-type="json" :editable="!isSubmitting"
                     :starter-kit="sponsorDescriptionStarterKit"
                     :placeholder="{ placeholder: 'Description du sponsor...', showOnlyWhenEditable: true }"
                     class="w-full min-h-72 flex flex-col gap-2 mt-2 md:mt-4">
              <UEditorToolbar v-if="$device.isDesktopOrTablet" :editor class="sm:px-8 overflow-x-auto"
                              :items="$device.isDesktopOrTablet ? sponsorDescriptionToolbarItems : sponsorDescriptionToolbarItemsMobile"/>
            </UEditor>
          </UFormField>
        </UForm>
      </UContainer>
    </template>

    <template #footer="{ close }">
      <UButton type="submit" form="sponsor-create-form" :loading="isSubmitting">Ajouter</UButton>
      <UButton color="neutral" :disabled="isSubmitting" @click="close">Annuler</UButton>
    </template>
  </UModal>
</template>
