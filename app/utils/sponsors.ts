import type { StarterKitOptions } from "@tiptap/starter-kit";
import type { EditorToolbarItem } from "@nuxt/ui";

export const sponsorDescriptionStarterKit: Partial<StarterKitOptions> = {
  blockquote: false,
  codeBlock: false,
  strike: false,
  horizontalRule: false,
  heading: false,
  link: {
    defaultProtocol: "https",
  },
};

export function sponsorHasDescription(sponsor: Sponsor) {
  return richTextHasContent(normalizeRichTextDocument(sponsor.description));
}

export const sponsorDescriptionToolbarItems: EditorToolbarItem[][] = [
  [{
    label: "Annuler",
    icon: "i-lucide-undo-2",
    kind: "undo",
  }, {
    label: "Rétablir",
    icon: "i-lucide-redo-2",
    kind: "redo",
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


export const sponsorDescriptionToolbarItemsMobile: EditorToolbarItem[][] = [
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
    icon: "i-lucide-list",
    tooltip: {text: "Lists"},
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
    kind: "mark",
    mark: "underline",
    icon: "i-lucide-underline",
    tooltip: {text: "Souligné"},
  }],
];