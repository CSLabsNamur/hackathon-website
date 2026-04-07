import type { JSONContent } from "@tiptap/core";

export const createEmptyRichTextDocument = (): JSONContent => ({
  type: "doc",
  content: [{type: "paragraph"}],
});

export const isRichTextDocument = (input: unknown): input is JSONContent => {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return false;
  }

  const value = input as Record<string, unknown>;

  return value.type === "doc" && (value.content === undefined || Array.isArray(value.content));
};

export const normalizeRichTextDocument = (input?: unknown): JSONContent => {
  return isRichTextDocument(input) ? input : createEmptyRichTextDocument();
};

export const richTextHasContent = (input?: JSONContent | null): boolean => {
  if (!input) return false;

  if (typeof input.text === "string" && input.text.trim().length > 0) return true;

  if (Array.isArray(input.content)) {
    return input.content.some((child) => richTextHasContent(child));
  }

  return false;
};

export const richTextToPlainText = (input?: JSONContent | null): string => {
  if (!input) return "";

  const text = typeof input.text === "string" ? input.text : "";
  const children = Array.isArray(input.content)
    ? input.content.map((child) => richTextToPlainText(child)).filter(Boolean)
    : [];

  return [text, ...children].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
};
