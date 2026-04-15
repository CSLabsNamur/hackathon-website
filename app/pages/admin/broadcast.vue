<script setup lang="ts">
import type * as v from "valibot";
import type { EditorSuggestionMenuItem, FormErrorEvent, FormSubmitEvent } from "#ui/types";
import type { Reactive } from "vue";
import schema from "#shared/schemas/broadcasts/create";
import type { StarterKitOptions } from "@tiptap/starter-kit";
import { Emoji, gitHubEmojis } from "@tiptap/extension-emoji";
import { CharacterCount } from "@tiptap/extension-character-count";
import type { DropdownMenuItem, EditorToolbarItem } from "@nuxt/ui";
import { upperFirst } from "scule";
import { mapEditorItems } from "@nuxt/ui/utils/editor";
import type { Editor, JSONContent } from "@tiptap/vue-3";

definePageMeta({
  layout: {
    name: "dashboard",
    props: {
      title: "Annonce",
    },
  },
  middleware: "admin-auth",
  requiredPermissions: ["broadcasts.send"],
});

const actions = useBroadcastsActions();
const toast = useToast();
const {data: currentAdmin} = await useCurrentAdmin();
const {can} = useAbility(currentAdmin);
const canSendBroadcast = computed(() => can("send", "Broadcast"));

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
  label: "Cautions non payées",
  value: "Cautions",
  icon: "i-lucide-alert-triangle",
}, {
  label: "Tous",
  value: "Tous",
  icon: "i-lucide-globe",
}];

const isSubmitting = ref(false);

//region Editor
const starterKit: Partial<StarterKitOptions> = {
  link: {
    defaultProtocol: "https",
  },
};
const toolbarItems: EditorToolbarItem[][] = [
  [{
    //label: "Annuler",
    icon: "i-lucide-undo-2",
    kind: "undo",
  }, {
    //label: "Rétablir",
    icon: "i-lucide-redo-2",
    kind: "redo",
  }],
  [{
    label: "",
    icon: "i-lucide-type",
    active: false,
    items: [{
      label: "Paragraphe",
      icon: "i-lucide-type",
      kind: "paragraph",
    }, {
      label: "Titre 1",
      icon: "i-lucide-heading-1",
      kind: "heading",
      level: 1,
    }, {
      label: "Titre 2",
      icon: "i-lucide-heading-2",
      kind: "heading",
      level: 2,
    }, {
      label: "Titre 3",
      icon: "i-lucide-heading-3",
      kind: "heading",
      level: 3,
    }, {
      label: "Titre 4",
      icon: "i-lucide-heading-4",
      kind: "heading",
      level: 4,
    }],
  }],
  [{
    label: "Gras",
    icon: "i-lucide-bold",
    kind: "mark",
    mark: "bold",
  }, {
    label: "Italique",
    icon: "i-lucide-italic",
    kind: "mark",
    mark: "italic",
  }, {
    label: "Lien",
    icon: "i-lucide-link",
    kind: "link",
  }],
  [{
    label: "Liste à puces",
    icon: "i-lucide-list",
    kind: "bulletList",
  }, {
    label: "Liste numérotée",
    icon: "i-lucide-list-ordered",
    kind: "orderedList",
  }],
];
const toolbarItemsMobile: EditorToolbarItem[][] = [
  [{
    kind: "undo",
    icon: "i-lucide-undo",
    tooltip: {text: "Annuler"},
  }, {
    kind: "redo",
    icon: "i-lucide-redo",
    tooltip: {text: "Rétablir"},
  }],
  [{
    icon: "i-lucide-type",
    active: false,
    items: [{
      label: "Paragraphe",
      icon: "i-lucide-type",
      kind: "paragraph",
    }, {
      label: "Titre 1",
      icon: "i-lucide-heading-1",
      kind: "heading",
      level: 1,
    }, {
      label: "Titre 2",
      icon: "i-lucide-heading-2",
      kind: "heading",
      level: 2,
    }, {
      label: "Titre 3",
      icon: "i-lucide-heading-3",
      kind: "heading",
      level: 3,
    }, {
      label: "Titre 4",
      icon: "i-lucide-heading-4",
      kind: "heading",
      level: 4,
    }],
  }],
  [{
    icon: "i-lucide-list",
    tooltip: {text: "Listes"},
    content: {
      align: "start",
    },
    items: [{
      kind: "bulletList",
      icon: "i-lucide-list",
      label: "Liste à puces",
    }, {
      kind: "orderedList",
      icon: "i-lucide-list-ordered",
      label: "Liste numérotée",
    }],
  }],
  [{
    kind: "mark",
    mark: "bold",
    icon: "i-lucide-bold",
    tooltip: {text: "Gras"},
  }, {
    kind: "mark",
    mark: "italic",
    icon: "i-lucide-italic",
    tooltip: {text: "Italique"},
  }, {
    kind: "link",
    icon: "i-lucide-link",
    tooltip: {text: "Lien"},
  }],
];

// SSR-safe function to append menus to body (avoids z-index issues in docs)
const appendToBody = import.meta.client ? () => document.body : undefined;
const emojiItems = gitHubEmojis.filter(emoji => !emoji.name.startsWith("regional_indicator_"));

const selectedNode = ref<{ node: JSONContent, pos: number }>();
const dragHandleItems = (editor: Editor): DropdownMenuItem[][] => {
  if (!selectedNode.value?.node?.type) {
    return [];
  }

  return mapEditorItems(editor, [[
    {
      type: "label",
      label: upperFirst(selectedNode.value.node.type),
    },
    {
      label: "Transformer en",
      icon: "i-lucide-repeat-2",
      children: [
        {kind: "paragraph", label: "Paragraph", icon: "i-lucide-type"},
        {kind: "heading", level: 1, label: "Heading 1", icon: "i-lucide-heading-1"},
        {kind: "heading", level: 2, label: "Heading 2", icon: "i-lucide-heading-2"},
        {kind: "heading", level: 3, label: "Heading 3", icon: "i-lucide-heading-3"},
        {kind: "heading", level: 4, label: "Heading 4", icon: "i-lucide-heading-4"},
        {kind: "bulletList", label: "Bullet List", icon: "i-lucide-list"},
        {kind: "orderedList", label: "Ordered List", icon: "i-lucide-list-ordered"},
        {kind: "blockquote", label: "Blockquote", icon: "i-lucide-text-quote"},
        {kind: "codeBlock", label: "Code Block", icon: "i-lucide-square-code"},
      ],
    },
    {
      label: "Effacer le formatage",
      icon: "i-lucide-rotate-ccw",
      kind: "clearFormatting",
      pos: selectedNode.value?.pos,
    },
  ], [
    {
      label: "Dupliquer",
      icon: "i-lucide-copy",
      kind: "duplicate",
      pos: selectedNode.value?.pos,
    },
    {
      label: "Copier le texte",
      icon: "i-lucide-clipboard",
      onSelect: async () => {
        if (!selectedNode.value) return;

        const pos = selectedNode.value.pos;
        const node = editor.state.doc.nodeAt(pos);
        if (node) {
          await navigator.clipboard.writeText(node.textContent);
        }
      },
    },
  ], [
    {
      label: "Déplacer vers le haut",
      icon: "i-lucide-arrow-up",
      kind: "moveUp",
      pos: selectedNode.value?.pos,
    },
    {
      label: "Déplacer vers le bas",
      icon: "i-lucide-arrow-down",
      kind: "moveDown",
      pos: selectedNode.value?.pos,
    },
  ], [
    {
      label: "Supprimer",
      icon: "i-lucide-trash",
      kind: "delete",
      pos: selectedNode.value?.pos,
    },
  ]]) as DropdownMenuItem[][];
};
const suggestionItems: EditorSuggestionMenuItem[][] = [[{
  label: "Titre 1",
  icon: "i-lucide-heading-1",
  kind: "heading",
  level: 1,
}, {
  label: "Titre 2",
  icon: "i-lucide-heading-2",
  kind: "heading",
  level: 2,
}, {
  label: "Titre 3",
  icon: "i-lucide-heading-3",
  kind: "heading",
  level: 3,
}, {
  label: "Titre 4",
  icon: "i-lucide-heading-4",
  kind: "heading",
  level: 4,
}, {
  label: "Liste à puces",
  icon: "i-lucide-list",
  kind: "bulletList",
}, {
  label: "Liste numérotée",
  icon: "i-lucide-list-ordered",
  kind: "orderedList",
}, {
  label: "Citation",
  icon: "i-lucide-text-quote",
  kind: "blockquote",
}, {
  label: "Code",
  icon: "i-lucide-square-code",
  kind: "codeBlock",
}]];

//endregion

async function onSubmit(event: FormSubmitEvent<Schema>) {
  if (!canSendBroadcast.value) return;

  try {
    isSubmitting.value = true;
    await actions.sendBroadcast(event.data);
    toast.add({
      title: "Annonce envoyée",
      description: "L'annonce a été envoyée avec succès.",
      color: "success",
    });
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
  <UContainer class="pb-6 md:pb-8">
    <ContentCard>
      <UForm id="broadcast-form" :schema :state :disabled="isSubmitting || !canSendBroadcast"
             class="flex flex-col gap-4 lg:gap-6"
             @submit="onSubmit" @error="onError">
        <UFormField label="Destinataires" name="recipients" required>
          <URadioGroup v-model="state.recipients" :items="recipientsItems"
                       :orientation="$device.isDesktopOrTablet ? 'horizontal' : 'vertical'" variant="table">
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
          <UEditor v-slot="{ editor, handlers }" v-model="state.message" content-type="html"
                   :editable="!isSubmitting && canSendBroadcast" :starter-kit="starterKit"
                   :extensions="[Emoji, CharacterCount.configure({limit: 20000})]"
                   :placeholder="{placeholder: 'Contenu de l’annonce...', showOnlyWhenEditable: true}"
                   class="w-full min-h-72 flex flex-col gap-2 mt-2 md:mt-4 border border-muted rounded-md p-6 pt-2.5 focus-within:ring-2 focus-within:ring-primary">
            <UEditorToolbar v-if="$device.isDesktopOrTablet" :editor class="sm:px-8 overflow-x-auto"
                            :items="toolbarItems"/>
            <UEditorToolbar v-else :editor class="sm:px-8 overflow-x-auto" :items="toolbarItemsMobile"
                            layout="bubble"/>
            <UEditorEmojiMenu :editor :emojis="gitHubEmojis" :items="emojiItems" :append-to="appendToBody"/>
            <UEditorSuggestionMenu :editor :items="suggestionItems" :append-to="appendToBody"/>
            <UEditorDragHandle v-slot="{ ui, onClick }" :editor @node-change="selectedNode = $event">
              <UButton icon="i-lucide-plus" variant="ghost" color="neutral" active-variant="soft"
                       size="sm" :class="ui.handle()" @click="(e: Event) => {
                           e.stopPropagation();
                           const selected = onClick();
                           handlers.suggestion?.execute(editor, {pos: selected?.pos}).run();
                         }"/>
              <UDropdownMenu v-slot="{ open }" :modal="false" :items="dragHandleItems(editor)"
                             :content="{side: 'left'}" :ui="{content: 'w-48', label: 'text-xs'}"
                             @update:open="editor.chain().setMeta('lockDragHandle', $event).run()">
                <UButton icon="i-lucide-grip-vertical" variant="ghost" color="neutral" active-variant="soft"
                         size="sm" :active="open" :class="ui.handle()"/>
              </UDropdownMenu>
            </UEditorDragHandle>
          </UEditor>
        </UFormField>

        <UFormField label="Pièce(s) jointe(s)" name="attachments">
          <UFileUpload v-model="state.attachments" label="Déposez vos fichiers ici" description="Max 5MB chacun"
                       multiple icon="i-lucide-file-user" size="sm" position="inside" layout="list"/>
        </UFormField>
      </UForm>

      <template #footer>
        <div class="flex justify-end">
          <UButton type="submit" form="broadcast-form" icon="i-lucide-send" :loading="isSubmitting"
                   :disabled="!canSendBroadcast">
            Envoyer
          </UButton>
        </div>
      </template>
    </ContentCard>
  </UContainer>
</template>
