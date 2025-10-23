<script setup lang="ts">
import * as v from "valibot";
import type { FormErrorEvent, FormSubmitEvent } from "#ui/types";
import type { Reactive } from "vue";

const emit = defineEmits<{ close: [boolean] }>();

const toast = useToast();

const schema = v.pipe(
    v.object({
      oldPassword: v.string(),
      password: v.pipe(v.string(), v.minLength(8, "Le mot de passe doit contenir au moins 8 caractères"), v.regex(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/, "Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial")),
      passwordConfirm: v.string(),
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
  oldPassword: "",
  password: "",
  passwordConfirm: "",
});

const isSubmitting = ref(false);

async function onSubmit(event: FormSubmitEvent<Schema>) {
  try {
    isSubmitting.value = true;

    toast.add({
      title: "Mot de passe modifié",
      description: "Le mot de passe a été modifié avec succès.",
      color: "success",
    });

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
  <UModal :close="{onClick: () => emit('close', false)}" title="Modifier le mot de passe"
          :ui="{content: 'max-w-2xl'}">
    <template #body>
      <UForm :schema :state class="grid grid-cols-1 md:grid-cols-2 gap-6" @submit="onSubmit" @error="onError"
             id="password-update-form">
        <UFormField label="Ancien mot de passe" name="oldPassword" required class="col-span-2">
          <UInput v-model="state.oldPassword" icon="i-lucide-lock" type="password" class="w-full"/>
        </UFormField>

        <UFormField label="Mot de passe" name="password" required>
          <UInput v-model="state.password" icon="i-lucide-lock" type="password" class="w-full"/>
        </UFormField>

        <UFormField label="Confirmer le mot de passe" name="passwordConfirm" required>
          <UInput v-model="state.passwordConfirm" icon="i-lucide-lock" type="password" class="w-full"/>
        </UFormField>
      </UForm>
    </template>
    <template #footer>
      <div class="flex justify-end gap-3">
        <UButton type="submit" form="password-update-form" :loading="isSubmitting">Enregistrer</UButton>
        <UButton color="neutral" @click="emit('close', false)">Annuler</UButton>
      </div>
    </template>
  </UModal>
</template>
