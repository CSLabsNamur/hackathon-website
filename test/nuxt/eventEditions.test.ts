import { afterEach, describe, expect, it, vi } from "vitest";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { DOMWrapper, flushPromises, type VueWrapper } from "@vue/test-utils";
import EventRolloverForm from "../../app/components/admin/event/RolloverForm.vue";
import { currentEdition, nextEdition } from "../fixtures/event";

describe("rollover confirmation", () => {
  let wrapper: VueWrapper;

  afterEach(() => wrapper.unmount());

  it("requires content review and the exact current title before submitting the next edition", async () => {
    wrapper = await mountSuspended(EventRolloverForm, {
      props: {event: currentEdition, revision: nextEdition.revision},
      attachTo: document.body,
    });
    const title = wrapper.get<HTMLInputElement>('input[name="title"]');
    expect(title.element.value).toBe("");
    await title.setValue("Hackathon 2027");
    const slogan = wrapper.get<HTMLInputElement>('input[name="slogan"]');
    expect(slogan.element.value).toBe("");
    await slogan.setValue("Créons demain ensemble");

    const prepare = wrapper.findAll("button").find((button) => button.text() === "Préparer la nouvelle édition")!;
    expect(prepare.attributes("disabled")).toBeDefined();

    await wrapper.get('[role="checkbox"]').trigger("click");
    await prepare.trigger("click");
    await flushPromises();

    const dialog = new DOMWrapper(document.body).get('[role="dialog"]');
    const confirmation = dialog.get("input");
    const submit = dialog.get<HTMLButtonElement>('button[type="submit"]');
    await confirmation.setValue("Wrong edition");
    expect(submit.element.disabled).toBe(true);
    expect(wrapper.emitted("submit")).toBeUndefined();

    await confirmation.setValue(currentEdition.title);
    expect(submit.element.disabled).toBe(false);
    await wrapper.get("form").trigger("submit");
    await flushPromises();

    await vi.waitFor(() => expect(wrapper.emitted("submit")).toEqual([[expect.objectContaining({
      editionId: currentEdition.editionId,
      revision: nextEdition.revision,
      confirmation: currentEdition.title,
      reviewedArchive: true,
      title: "Hackathon 2027",
      slogan: "Créons demain ensemble",
      startDate: "2027-03-27T18:00",
      endDate: "2027-03-29T18:00",
      registrationsStartDate: "2026-11-01T00:00",
      registrationsEndDate: "2027-03-27T18:00",
    })]]));
  });
});
