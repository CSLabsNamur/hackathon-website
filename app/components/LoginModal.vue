<script setup lang="ts">
import * as v from "valibot";
import type { AuthFormField, FormError, FormSubmitEvent } from "@nuxt/ui";

const emit = defineEmits<{ close: [boolean] }>();

const toast = useToast();
const supabaseClient = useSupabaseClient();
const siteConfig = useSiteConfig();

const submitted = ref(false);

const alreadyHaveCode = ref(false);
const error = ref<string | null>("");
const pendingOtpEmail = useLocalStorage<string | null>("pending-login-email", null, {
  serializer: {
    read: (value) => value.trim() || null,
    write: (value) => value?.trim() ?? "",
  },
});
const resendCountdown = useCountdown(120);

const emailField: AuthFormField = {
  name: "email",
  type: "email",
  autocomplete: "on",
  label: "Email",
  placeholder: "Entrez votre adresse email",
  required: true,
};

const otpField = computed<AuthFormField>(() => ({
  name: "code",
  label: pendingOtpEmail.value ? undefined : "Code de connexion",
  type: "otp",
  autocomplete: "off",
  length: 6,
  otp: {type: "number"},
  mask: true,
  required: true,
}));

const providers = [{
  label: "CSLabs - Admins",
  icon: "i-simple-icons-google",
  onClick: async () => {
    const res = await supabaseClient.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${siteConfig.url}/auth/callback`,
      },
    });
    if (res.error) {
      toast.add({title: "Erreur", description: res.error.message, color: "error"});
      return;
    }
  },
}];

const emailSchema = v.object({
  email: v.pipe(v.string("L'adresse email est obligatoire"), v.email("Adresse email invalide")),
});
const _codeSchema = v.object({
  code: v.pipe(v.array(v.number(undefined)), v.length(6, "Le code doit contenir 6 caractères")),
});

type Schema = v.InferOutput<typeof emailSchema>
type CodeSchema = v.InferOutput<typeof _codeSchema>
type CodeFormData = CodeSchema & { email?: string }

const shouldAskEmailForCode = computed(() => alreadyHaveCode.value && !pendingOtpEmail.value);
const verificationFields = computed<AuthFormField[]>(() => shouldAskEmailForCode.value ? [emailField, otpField.value] : [otpField.value]);
const verificationDescription = computed(() => {
  if (!alreadyHaveCode.value) {
    return "Un lien de connexion a été envoyé à votre adresse email. Cliquez sur le lien pour vous connecter, ou entrez le code ci-dessous.";
  }

  if (shouldAskEmailForCode.value) {
    return "Entrez l'adresse email à laquelle le code a été envoyé, puis saisissez le code ci-dessous.";
  }

  return `Entrez le code reçu par mail à l'adresse ${maskEmail(pendingOtpEmail.value!)} pour vous connecter.`;
});

function maskEmail(value: string) {
  const [localPart = "", domain = ""] = value.split("@");
  if (!localPart || !domain) return value;

  const maskedLocalPart = localPart.length <= 2
      ? `${localPart[0] ?? ""}*`
      : `${localPart.slice(0, 2)}${"*".repeat(Math.max(localPart.length - 2, 1))}`;

  return `${maskedLocalPart}@${domain}`;
}

function resetStoredEmail() {
  pendingOtpEmail.value = null;
  error.value = null;
}

async function didNotReceiveCode() {
  if (pendingOtpEmail.value) {
    if (resendCountdown.isActive.value) return;

    await onSubmit({data: {email: pendingOtpEmail.value}} as FormSubmitEvent<Schema>);
    toast.add({
      title: "Code renvoyé",
      description: `Un nouveau code de connexion a été envoyé à ${pendingOtpEmail.value}. Vérifiez votre boîte de réception.`,
      color: "success",
    });

    resendCountdown.start();

    return;
  }

  alreadyHaveCode.value = false;
}

const validateCode = ({code, email}: CodeFormData): FormError[] => {
  const errors: FormError[] = [];

  if (shouldAskEmailForCode.value) {
    const result = v.safeParse(emailSchema, {email: email?.trim() ?? ""});
    if (!result.success) {
      errors.push({
        name: "email",
        message: result.issues[0]?.message ?? "Adresse email invalide",
      });
    }
  }

  if ((code.filter(c => c !== undefined)).length !== 6) {
    errors.push({
      name: "code",
      message: "Le code doit contenir 6 caractères",
    });
  }

  if (code.some(c => isNaN(c) && c !== undefined)) {
    errors.push({
      name: "code",
      message: "Le code doit être composé de chiffres uniquement",
    });
  }

  return errors;
};

async function onSubmit(payload: FormSubmitEvent<Schema>) {
  const normalizedEmail = payload.data.email.trim();
  const res = await supabaseClient.auth.signInWithOtp({
    email: normalizedEmail,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: `${siteConfig.url}/auth/callback`,
    },
  });
  if (res.error) {
    if (res.error.code === "otp_disabled") {
      error.value = "Cet utilisateur est introuvable. Veuillez vérifier votre adresse email ou contacter un administrateur.";
      return;
    }
    console.error(res.error);
    error.value = "Une erreur est survenue lors de l'envoi du code de connexion. Veuillez réessayer plus tard ou contacter un administrateur.";
    return;
  }

  resendCountdown.start();

  error.value = null;
  pendingOtpEmail.value = normalizedEmail;
  alreadyHaveCode.value = false;
  submitted.value = true;
}

async function onCodeSubmit(payload: FormSubmitEvent<CodeFormData>) {
  if (!submitted.value && !alreadyHaveCode.value) return;

  const verificationEmail = payload.data.email?.trim() || pendingOtpEmail.value;
  if (!verificationEmail) {
    toast.add({title: "Erreur", description: "L'adresse email liée à ce code est requise.", color: "error"});
    return;
  }

  pendingOtpEmail.value = verificationEmail;
  const res = await supabaseClient.auth.verifyOtp({
    type: "email",
    email: verificationEmail,
    token: payload.data.code.join(""),
  });
  if (res.error) {
    toast.add({title: "Erreur", description: res.error.message, color: "error"});
    return;
  }

  pendingOtpEmail.value = null;
  emit("close", true);
}
</script>

<template>
  <UModal :close="{onClick: () => emit('close', false)}"
          :ui="{content: 'max-w-md', header: 'border-none absolute right-0', body: ''}">
    <template #body>
      <UAuthForm v-if="!submitted && !alreadyHaveCode" :schema="emailSchema" title="Se connecter"
                 description="Entrez votre adresse email pour vous connecter." separator="ou" icon="i-lucide-user"
                 :fields="[emailField]" :providers="providers" loading-auto @submit="onSubmit">
        <template #validation>
          <UAlert v-if="error" color="error" icon="i-lucide-alert-triangle" title="Erreur" :description="error"/>
        </template>
        <template #footer>
          <ULink @click="alreadyHaveCode = true">J'ai déjà un code de connexion</ULink>
        </template>
      </UAuthForm>
      <UAuthForm v-else :title="alreadyHaveCode ? 'Validation du code' : 'Vérifiez votre email'"
                 :description="verificationDescription" :validate="validateCode" icon="i-lucide-mail"
                 :fields="verificationFields" loading-auto :ui="{form: 'grid *:place-self-center'}"
                 @submit="onCodeSubmit">
        <template #footer>
          <div class="flex gap-2 items-center justify-center">
            <UTooltip
                :text="`Veuillez patienter ${resendCountdown.remaining.value}s avant l'envoi d'un nouveau code.`"
                :disabled="!resendCountdown.isActive.value">
              <UButton variant="link" color="neutral" :disabled="resendCountdown.isActive.value"
                       @click="didNotReceiveCode()">
                Je n'ai pas reçu de code
                {{ resendCountdown.isActive.value ? `(${resendCountdown.remaining.value}s)` : undefined }}
              </UButton>
            </UTooltip>
            <USeparator v-if="pendingOtpEmail && alreadyHaveCode" orientation="vertical" class="h-6"/>
            <UButton v-if="pendingOtpEmail && alreadyHaveCode" variant="link" color="neutral"
                     @click="resetStoredEmail()">
              Utiliser une autre adresse email
            </UButton>
          </div>
        </template>
      </UAuthForm>
    </template>
  </UModal>
</template>
