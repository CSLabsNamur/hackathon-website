<script setup lang="ts">
import * as v from "valibot";
import type { AuthFormField, FormSubmitEvent } from "@nuxt/ui";

const emit = defineEmits<{ close: [boolean] }>();

const toast = useToast();
const supabaseClient = useSupabaseClient();

const submitted = ref(false);
const email = ref("");

const fields: AuthFormField[] = [{
  name: "email",
  type: "email",
  label: "Email",
  placeholder: "Entrez votre adresse email",
  required: true,
}];
//@ts-expect-error Wrong type definition on Nuxt UI's side. This is valid.
const codeFields: AuthFormField[] = [{
  name: "code",
  type: "otp",
  length: 6,
  otp: {type: "number"},
  mask: true,
  required: true,
}];

const providers = [{
  label: "CSLabs",
  icon: "i-simple-icons-google",
  onClick: async () => {
    const res = await supabaseClient.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `http://localhost:3000/auth/callback`,
      },
    });
    if (res.error) {
      toast.add({title: "Erreur", description: res.error.message, color: "error"});
      return;
    }
  },
}];

const schema = v.object({
  email: v.pipe(v.string("L'adresse email est obligatoire"), v.email("Adresse email invalide")),
});
const codeSchema = v.object({
  code: v.pipe(v.array(v.number(undefined)), v.length(6, "Le code doit contenir 6 caractères")),
});

type Schema = v.InferOutput<typeof schema>
type CodeSchema = v.InferOutput<typeof codeSchema>

async function onSubmit(payload: FormSubmitEvent<Schema>) {
  if (submitted.value) return;

  console.log("Submitted", payload);
  const res = await supabaseClient.auth.signInWithOtp({
    email: payload.data.email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: `http://localhost:3000/auth/callback`,
    },
  });
  if (res.error) {
    toast.add({title: "Erreur", description: res.error.message, color: "error"});
    return;
  }

  email.value = payload.data.email;
  submitted.value = true;
}

async function onCodeSubmit(payload: FormSubmitEvent<CodeSchema>) {
  if (!submitted.value) return;

  const res = await supabaseClient.auth.verifyOtp({
    type: "email",
    email: email.value,
    token: payload.data.code.join(""),
  });
  if (res.error) {
    toast.add({title: "Erreur", description: res.error.message, color: "error"});
    return;
  }

  console.log("Code Submitted", payload);
  emit("close", true);
}
</script>

<template>
  <UModal :close="{onClick: () => emit('close', false)}"
          :ui="{content: 'max-w-md', header: 'border-none absolute right-0', body: ''}">
    <template #body>
      <UAuthForm
          v-if="!submitted"
          :schema="schema"
          title="Se connecter"
          description="Entrez votre adresse email pour vous connecter."
          separator="ou"
          icon="i-lucide-user"
          :fields="fields"
          :providers="providers"
          loading-auto
          @submit="onSubmit"/>
      <UAuthForm
          v-else
          :schema="codeSchema"
          title="Vérifiez votre email"
          description="Un lien de connexion a été envoyé à votre adresse email. Cliquez sur le lien pour vous connecter, ou entrez le code ci-dessous."
          icon="i-lucide-mail"
          :fields="codeFields"
          @submit="onCodeSubmit"
          loading-auto
          :ui="{form: 'grid *:first:place-self-center'}">
        <!--        <template #submit="{loading}">-->
        <!--          <UButton :loading="loading" type="submit" :ui="{base: 'w-full justify-center'}">Vérifier le code</UButton>-->
        <!--        </template>-->
      </UAuthForm>
    </template>
  </UModal>
</template>
