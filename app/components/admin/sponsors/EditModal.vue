<script setup lang="ts">
import type * as v from "valibot";
import type { FormErrorEvent, FormSubmitEvent } from "#ui/types";
import schema from "#shared/schemas/sponsors/edit";

const props = defineProps<{ sponsor: Sponsor }>();
const emit = defineEmits<{ close: [boolean] }>();

const toast = useToast();
const {updateSponsor} = useSponsorsActions();

type Schema = v.InferOutput<typeof schema>

const sponsorLogoAccept = acceptedFormatsToHtmlAccept(ACCEPTED_SPONSOR_LOGO_EXTS);
const sponsorLogoFormatsLabel = acceptedFormatsToLabel(ACCEPTED_SPONSOR_LOGO_EXTS)?.toUpperCase() ?? "PNG, JPG, JPEG, WEBP";
const sponsorLogoDescription = `${sponsorLogoFormatsLabel}, max 5MB`;

const state = reactive<Schema>({
  name: props.sponsor.name,
  description: normalizeRichTextDocument(props.sponsor.description),
  logoFile: undefined,
  url: props.sponsor.url,
  hasBadge: props.sponsor.hasBadge,
});

const isSubmitting = ref(false);

async function onSubmit(event: FormSubmitEvent<Schema>) {
  try {
    isSubmitting.value = true;

    await updateSponsor(props.sponsor.id, event.data);

    toast.add({
      title: "Sponsor modifié",
      description: "Le sponsor a été modifié avec succès.",
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
  <UModal title="Modifier le sponsor"
          :description="`Modifier les informations de ${sponsor.name}`"
          :dismissible="!isSubmitting" :close="{disabled: isSubmitting, onClick: () => emit('close', false)}"
          :ui="{content: 'max-w-4xl', footer: 'justify-end'}">
    <template #body>
      <UContainer>
        <UForm id="sponsor-edit-form" :schema :state :disabled="isSubmitting"
               class="grid grid-cols-1 md:grid-cols-2 gap-6"
               @submit="onSubmit" @error="onError">
          <UFormField label="Nom" name="name" required>
            <UInput v-model="state.name" icon="i-lucide-building-2" class="w-full"/>
          </UFormField>

          <UFormField label="Site web" name="url" required>
            <UInput v-model="state.url" type="url" icon="i-lucide-link" class="w-full"/>
          </UFormField>

          <UFormField label="Logo" name="logoFile" class="md:col-span-2"
                      :description="`Laissez vide pour conserver le logo actuel. ${sponsorLogoDescription}`">
            <UFileUpload v-model="state.logoFile" :accept="sponsorLogoAccept" hint="Déposez un nouveau logo ici"
                         label="Déposez un nouveau logo ici" :description="sponsorLogoDescription"
                         icon="i-lucide-image-up" size="sm" position="inside" layout="list"/>

            <div v-if="sponsor.logo" class="mt-4 flex items-center gap-4">
              <img :src="sponsor.logo" :alt="`Logo de ${sponsor.name}`"
                   class="max-h-20 max-w-32 rounded object-contain bg-default p-2">
              <UButton :to="sponsor.logo" target="_blank" external variant="link" icon="i-lucide-image">
                Voir le logo actuel
              </UButton>
            </div>
          </UFormField>

          <UFormField name="hasBadge" class="md:col-span-2">
            <UCheckbox v-model="state.hasBadge" label="Prévoir un badge pour ce sponsor"/>
          </UFormField>

          <UFormField label="Description" name="description" class="md:col-span-2"
                      description="Texte affiché sur la page partenaires">
            <UEditor v-slot="{ editor }" v-model="state.description" content-type="json" :editable="!isSubmitting"
                     :starter-kit="sponsorDescriptionStarterKit"
                     :placeholder="{placeholder: 'Décrivez ce sponsor...', showOnlyWhenEditable: true}"
                     class="w-full min-h-72 flex flex-col gap-2 mt-2 md:mt-4">
              <UEditorToolbar v-if="$device.isDesktopOrTablet" :editor class="sm:px-8 overflow-x-auto"
                              :items="$device.isDesktopOrTablet ? sponsorDescriptionToolbarItems : sponsorDescriptionToolbarItemsMobile"/>
            </UEditor>
          </UFormField>
        </UForm>
      </UContainer>
    </template>

    <template #footer="{ close }">
      <UButton type="submit" form="sponsor-edit-form" :loading="isSubmitting">Enregistrer</UButton>
      <UButton color="neutral" :disabled="isSubmitting" @click="close">Annuler</UButton>
    </template>
  </UModal>
</template>
