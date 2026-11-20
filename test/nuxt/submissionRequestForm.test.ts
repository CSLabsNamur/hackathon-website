import { afterEach, describe, expect, it, vi } from "vitest";
import { DOMWrapper, flushPromises, type VueWrapper } from "@vue/test-utils";
import { mockNuxtImport, mountSuspended } from "@nuxt/test-utils/runtime";
import FormModal from "../../app/components/admin/submission-request/FormModal.vue";

const {create, edit} = vi.hoisted(() => ({create: vi.fn().mockResolvedValue(undefined), edit: vi.fn().mockResolvedValue(undefined)}));
mockNuxtImport("useSubmissionsRequestsActions", () => () => ({createSubmissionRequest: create, editSubmissionRequest: edit}));

const settings = {editionId: "edition", startDate: "2026-06-01T07:00:00.000Z", endDate: "2026-06-01T16:00:00.000Z"};

describe("submission request form", () => {
  let wrapper: VueWrapper;
  afterEach(() => {
    wrapper?.unmount();
    vi.clearAllMocks();
  });

  it("creates a request with no instructions and retains its configured time zone input", async () => {
    wrapper = await mountSuspended(FormModal, {props: {settings}, attrs: {open: true}, attachTo: document.body});
    const form = new DOMWrapper(document.body).get("form");
    await form.get('input[name="title"]').setValue("Prototype");
    const deadline = form.get<HTMLInputElement>('input[type="datetime-local"]').element;
    expect(deadline.value).toBe("2026-06-01T18:00");
    expect(deadline.min).toBe("2026-06-01T09:00");
    expect(deadline.max).toBe("2026-06-01T18:00");
    await form.trigger("submit");
    await flushPromises();

    expect(create).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
      type: "text", title: "Prototype", description: "", deadline: "2026-06-01T18:00", expectedEditionId: settings.editionId,
    }));
    expect(wrapper.emitted("close")).toEqual([[true]]);
  });

  it("lets staff extend a deadline after responses arrive without sending structural changes", async () => {
    const request: AdminSubmissionRequest = {
      id: "request", title: "Prototype", type: "FILE", required: true, teamRequest: true,
      multiple: false, description: "Fichier PDF", deadline: "2026-06-01T12:00:00Z",
      acceptedFormats: ["pdf"], createdAt: "2026-05-01T12:00:00Z", updatedAt: "2026-05-01T12:00:00Z",
      _count: {submissions: 1}, progress: null,
    };
    wrapper = await mountSuspended(FormModal, {props: {settings, request}, attrs: {open: true}, attachTo: document.body});
    const form = new DOMWrapper(document.body).get("form");
    expect(form.find('[role="checkbox"]').exists()).toBe(false);
    const deadline = form.get<HTMLInputElement>('input[type="datetime-local"]');
    expect(deadline.element.value).toBe("2026-06-01T14:00");
    await deadline.setValue("2026-06-01T17:00");
    await form.trigger("submit");
    await flushPromises();

    expect(edit).toHaveBeenCalledExactlyOnceWith(request.id, {
      title: request.title, description: request.description, deadline: "2026-06-01T17:00", expectedUpdatedAt: request.updatedAt,
    });
  });
});
