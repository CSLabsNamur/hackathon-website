import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mockNuxtImport, mountSuspended } from "@nuxt/test-utils/runtime";
import { DOMWrapper, flushPromises, type VueWrapper } from "@vue/test-utils";
import { ref } from "vue";
import CheckInPage from "../../app/pages/admin/check-in.vue";

const mocks = vi.hoisted(() => ({
  useParticipantCheckIn: vi.fn(),
  updateCheckIn: vi.fn(),
  refresh: vi.fn(),
  toast: vi.fn(),
  interval: vi.fn(),
}));

mockNuxtImport("useParticipantCheckIn", () => mocks.useParticipantCheckIn);
mockNuxtImport("useParticipantsActions", () => () => ({updateCheckIn: mocks.updateCheckIn}));
mockNuxtImport("useToast", () => () => ({add: mocks.toast}));
mockNuxtImport("useIntervalFn", () => mocks.interval);

const arrivals = [
  {id: "first", user: {firstName: "Élodie", lastName: "Dupont", email: "elodie@example.test"}, team: {name: "Les Castors"}, checkedInAt: null},
  {id: "second", user: {firstName: "Martin", lastName: "Jacques", email: "martin@example.test"}, team: null, checkedInAt: "2026-03-27T08:30:00.000Z"},
];

describe("participant reception page", () => {
  let wrapper: VueWrapper;
  const participants = ref(structuredClone(arrivals));
  const error = ref<Error | null>(null);

  beforeEach(() => {
    vi.clearAllMocks();
    participants.value = structuredClone(arrivals);
    error.value = null;
    mocks.useParticipantCheckIn.mockResolvedValue({data: participants, status: ref("success"), error, refresh: mocks.refresh});
    mocks.updateCheckIn.mockResolvedValue({});
  });
  afterEach(() => wrapper?.unmount());

  it("finds participants by name in either order, without accents, email, or team", async () => {
    wrapper = await mountSuspended(CheckInPage);
    const search = wrapper.get('input[aria-label="Rechercher un participant"]');

    for (const query of ["elodie", "Dupont Elodie", "elodie@example.test", "Castors"]) {
      await search.setValue(query);
      expect(wrapper.findAll("li"), query).toHaveLength(1);
      expect(wrapper.get("li").text()).toContain("Élodie Dupont");
    }
    await search.setValue("nobody-exists-here");
    expect(wrapper.text()).toContain("Aucun participant trouvé.");
    await search.setValue("");
    expect(wrapper.findAll("li")).toHaveLength(2);
  });

  it("saves a check-in and refreshes the shared attendance list", async () => {
    wrapper = await mountSuspended(CheckInPage);
    await wrapper.findAll("button").find((button) => button.text() === "Marquer présent")!.trigger("click");
    await flushPromises();

    expect(mocks.updateCheckIn).toHaveBeenCalledExactlyOnceWith("first", true);
    expect(mocks.refresh).toHaveBeenCalledOnce();
    expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({title: "Présence enregistrée"}));
  });

  it("filters by attendance without changing the overall counts", async () => {
    wrapper = await mountSuspended(CheckInPage, {attachTo: document.body});
    await wrapper.get('[aria-label="Filtrer par présence"]').trigger("click");
    await flushPromises();
    const options = new DOMWrapper(document.body).findAll('[role="option"]');
    await options.find((option) => option.text().includes("À accueillir"))!.trigger("keydown", {key: "Enter"});
    await flushPromises();

    expect(wrapper.findAll("li")).toHaveLength(1);
    expect(wrapper.get("li").text()).toContain("Élodie Dupont");
    expect(wrapper.get('[aria-live="polite"]').text()).toMatch(/Inscrits\s*2/);
    expect(wrapper.get('[aria-live="polite"]').text()).toMatch(/Présents\s*1/);
  });

  it("refreshes arrivals from the other desk and reflects the updated status", async () => {
    wrapper = await mountSuspended(CheckInPage);
    mocks.refresh.mockImplementationOnce(() => {
      participants.value[0]!.checkedInAt = "2026-03-27T09:00:00.000Z";
    });
    const [poll, interval] = mocks.interval.mock.calls[0]!;
    expect(interval).toBe(10000);
    poll();
    await flushPromises();

    expect(mocks.refresh).toHaveBeenCalledOnce();
    expect(wrapper.findAll("button").some((button) => button.text() === "Marquer présent")).toBe(false);
  });

  it("prevents duplicate submissions and polling while a check-in is saving", async () => {
    let complete!: () => void;
    mocks.updateCheckIn.mockReturnValueOnce(new Promise<void>((resolve) => { complete = resolve; }));
    wrapper = await mountSuspended(CheckInPage);
    const checkIn = wrapper.findAll("button").find((button) => button.text() === "Marquer présent")!;
    await checkIn.trigger("click");
    await checkIn.trigger("click");
    mocks.interval.mock.calls[0]![0]();

    expect(mocks.updateCheckIn).toHaveBeenCalledOnce();
    expect(mocks.refresh).not.toHaveBeenCalled();
    complete();
    await flushPromises();
    expect(mocks.refresh).toHaveBeenCalledOnce();
  });

  it("does not claim a failed check-in succeeded", async () => {
    mocks.updateCheckIn.mockRejectedValue(new Error("Offline"));
    wrapper = await mountSuspended(CheckInPage);
    await wrapper.findAll("button").find((button) => button.text() === "Marquer présent")!.trigger("click");
    await flushPromises();

    expect(mocks.toast).not.toHaveBeenCalled();
    expect(mocks.refresh).not.toHaveBeenCalled();
    expect(participants.value[0]!.checkedInAt).toBeNull();
    expect(wrapper.findAll("button").find((button) => button.text() === "Marquer présent")!.attributes("disabled")).toBeUndefined();
  });

  it("blocks attendance changes while the list cannot be refreshed", async () => {
    error.value = new Error("Offline");
    wrapper = await mountSuspended(CheckInPage);

    expect(wrapper.text()).toContain("Vérifiez votre connexion");
    const checkIn = wrapper.findAll("button").find((button) => button.text() === "Marquer présent")!;
    expect(checkIn.attributes("disabled")).toBeDefined();
    expect(mocks.updateCheckIn).not.toHaveBeenCalled();
  });
});
