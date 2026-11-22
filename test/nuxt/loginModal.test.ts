import { afterEach, describe, expect, it, vi } from "vitest";
import { DOMWrapper, flushPromises, type VueWrapper } from "@vue/test-utils";
import { mockNuxtImport, mountSuspended } from "@nuxt/test-utils/runtime";
import LoginModal from "../../app/components/LoginModal.vue";

const {verifyOtp} = vi.hoisted(() => ({
  verifyOtp: vi.fn().mockResolvedValue({error: {message: "Invalid code"}}),
}));
mockNuxtImport("useSupabaseClient", () => () => ({auth: {verifyOtp, signInWithOtp: async () => ({error: null})}}));

describe("login modal", () => {
  let wrapper: VueWrapper;
  const dialog = new DOMWrapper(document.body);

  afterEach(() => {
    wrapper?.unmount();
    vi.clearAllMocks();
  });

  async function openCodeForm() {
    wrapper = await mountSuspended(LoginModal, {
      attrs: {open: true},
      attachTo: document.body,
      global: {stubs: {UTooltip: true}},
    });
    await dialog.get("input[name=\"email\"]").setValue("participant@example.test");
    await dialog.get("form").trigger("submit");
    await flushPromises();
    return dialog.findAll<HTMLInputElement>("input[inputmode=\"numeric\"]");
  }

  it("validates an untouched code on blur", async () => {
    const [digit] = await openCodeForm();
    digit!.element.focus();
    digit!.element.blur();
    await flushPromises();

    expect(dialog.text()).toContain("Le code doit contenir 6 caractères");
    expect(verifyOtp).not.toHaveBeenCalled();
  });

  it("verifies once when the final digit is entered, including a leading zero", async () => {
    const digits = await openCodeForm();
    for (const [index, digit] of digits.slice(0, -1).entries()) {
      await digit.setValue(String(index));
    }
    await flushPromises();
    expect(verifyOtp).not.toHaveBeenCalled();

    await digits.at(-1)!.setValue("5");
    await flushPromises();

    expect(verifyOtp).toHaveBeenCalledExactlyOnceWith({
      type: "email", email: "participant@example.test", token: "012345",
    });
  });
});
