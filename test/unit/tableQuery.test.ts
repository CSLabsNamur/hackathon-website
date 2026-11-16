// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { defineComponent, h, ref } from "vue";
import { createMemoryHistory, createRouter, useRoute, useRouter, type Router } from "vue-router";
import { useTableQuery } from "../../app/composables/useTableQuery";
import { useSearchQuery } from "../../app/composables/useSearchQuery";
import type { Guest } from "../../shared/utils/types";

describe("table URL state", () => {
  let wrapper: VueWrapper;
  let router: Router;
  let state: ReturnType<typeof useTableQuery>;
  let search: ReturnType<typeof useSearchQuery>;
  const guestRows: Pick<Guest, "id" | "name" | "company">[] = [
    {id: "coach", name: "Alice Martin", company: "ACME, Inc."},
    {id: "jury", name: "Bob Dupont", company: "École & Cie"},
    {id: "speaker", name: "Carol Lambert", company: null},
  ];
  const guests = ref<typeof guestRows | undefined>([...guestRows]);
  const participantOptions = {sort: ["name", "team"], filters: {caution: ["PAID", "NOT_PAID", "REFUNDED", "WAIVED"]}};
  const guestOptions = {sort: ["name", "quantity"], filters: {type: ["Conférencier", "Jury", "Coach", "Photographe", "Invité", "Autre"], company: () => [...new Set((guests.value ?? []).map(guest => guest.company || "Aucune"))]}};

  async function setup(url: string, options: Parameters<typeof useTableQuery>[0] = participantOptions) {
    vi.stubGlobal("useRoute", useRoute);
    vi.stubGlobal("useRouter", useRouter);
    router = createRouter({history: createMemoryHistory(), routes: [{path: "/:pathMatch(.*)*", component: {render: () => null}}]});
    await router.push(url);
    await router.isReady();
    wrapper = mount(defineComponent({
      setup() {
        state = useTableQuery(options);
        search = useSearchQuery();
        return () => h("div");
      },
    }), {global: {plugins: [router]}});
  }

  afterEach(() => {
    wrapper?.unmount();
    vi.unstubAllGlobals();
    guests.value = [...guestRows];
  });

  it("applies participant sorting, search, and a lowercase caution status", async () => {
    await setup("/admin/participants?sort=-team&caution=paid&search=alice");
    expect(state.sorting.value).toEqual([{id: "team", desc: true}]);
    expect(state.columnFilters.value).toEqual([{id: "caution", value: "PAID"}]);
    expect(search.value).toBe("alice");
  });

  it("applies guest type and company filters, including a company name containing commas", async () => {
    await setup("/admin/guests?sort=-quantity&type=coach&company=ACME%2C%20Inc.", guestOptions);
    expect(state.sorting.value).toEqual([{id: "quantity", desc: true}]);
    expect(state.columnFilters.value).toEqual([{id: "type", value: "Coach"}, {id: "company", value: "ACME, Inc."}]);
  });

  it("supports the guest table's Aucune choice for guests without a company", async () => {
    await setup("/admin/guests?company=Aucune", guestOptions);
    expect(state.columnFilters.value).toEqual([{id: "company", value: "Aucune"}]);
  });

  it("writes simultaneous UI changes without losing unrelated parameters or the hash", async () => {
    await setup("/admin/guests?keep=yes#table", guestOptions);
    state.sorting.value = [{id: "name", desc: true}];
    state.columnFilters.value = [{id: "type", value: "Jury"}, {id: "company", value: "École & Cie"}];
    search.value = "alice";
    await flushPromises();
    expect(router.currentRoute.value.query).toEqual({keep: "yes", sort: "-name", type: "Jury", company: "École & Cie", search: "alice"});
    expect(router.currentRoute.value.hash).toBe("#table");
  });

  it("removes cleared state from the URL", async () => {
    await setup("/admin/participants?sort=name&caution=paid&search=alice&keep=yes");
    state.sorting.value = [];
    state.columnFilters.value = [];
    search.value = "";
    await flushPromises();
    expect(router.currentRoute.value.query).toEqual({keep: "yes"});
  });

  it("clears one named filter while preserving the others and unrelated parameters", async () => {
    await setup("/admin/guests?type=coach&company=ACME%2C%20Inc.&keep=yes", guestOptions);
    state.columnFilters.value = [{id: "company", value: "ACME, Inc."}];
    await flushPromises();
    expect(router.currentRoute.value.query).toEqual({company: "ACME, Inc.", keep: "yes"});
  });

  it("reacts to navigation and restores defaults when query parameters disappear", async () => {
    await setup("/admin/participants?sort=name&caution=paid&search=alice");
    await router.push("/admin/participants?sort=-name&caution=not_paid&search=bob");
    expect(state.sorting.value).toEqual([{id: "name", desc: true}]);
    expect(state.columnFilters.value).toEqual([{id: "caution", value: "NOT_PAID"}]);
    expect(search.value).toBe("bob");
    router.back();
    await flushPromises();
    expect(state.columnFilters.value).toEqual([{id: "caution", value: "PAID"}]);
    await router.push("/admin/participants");
    expect(state.sorting.value).toEqual([]);
    expect(state.columnFilters.value).toEqual([]);
    expect(search.value).toBe("");
  });

  it("ignores malformed, duplicate, and unsupported sort/filter entries", async () => {
    await setup("/admin/participants?sort=actions&sort=name&caution=paid&caution=not_paid&unknown=paid&__proto__=paid");
    expect(state.sorting.value).toEqual([]);
    expect(state.columnFilters.value).toEqual([{id: "caution", value: "PAID"}]);
  });

  it("uses only the first repeated sort parameter", async () => {
    await setup("/admin/participants?sort=name&sort=-team");
    expect(state.sorting.value).toEqual([{id: "name", desc: false}]);
  });

  it("ignores comma-separated sort values", async () => {
    await setup("/admin/participants?sort=name,-team");
    expect(state.sorting.value).toEqual([]);
  });

  it("writes and applies only the first sort when given multiple columns", async () => {
    await setup("/admin/participants");
    state.sorting.value = [{id: "name", desc: true}, {id: "team", desc: false}];
    await flushPromises();
    expect(router.currentRoute.value.query).toEqual({sort: "-name"});
    expect(state.sorting.value).toEqual([{id: "name", desc: true}]);
  });

  it("ignores invalid, bare, and empty named filter values", async () => {
    await setup("/admin/guests?type=unknown&company=unknown", guestOptions);
    expect(state.columnFilters.value).toEqual([]);
    await router.push("/admin/guests?type&company=&sort");
    expect(state.columnFilters.value).toEqual([]);
    expect(state.sorting.value).toEqual([]);
  });

  it("applies dynamic filter choices once lazy table data loads", async () => {
    guests.value = undefined;
    await setup("/admin/guests?company=ACME%2C%20Inc.", guestOptions);
    expect(state.columnFilters.value).toEqual([]);
    guests.value = [...guestRows];
    expect(state.columnFilters.value).toEqual([{id: "company", value: "ACME, Inc."}]);
    await flushPromises();
    expect(router.currentRoute.value.query.company).toBe("ACME, Inc.");
  });

  it("keeps equivalent filters stable across data refreshes so selection is preserved", async () => {
    await setup("/admin/guests?company=ACME%2C%20Inc.", guestOptions);
    const filters = state.columnFilters.value;
    guests.value = [...guestRows, {id: "guest", name: "David Leclerc", company: "New company"}];
    expect(state.columnFilters.value).toBe(filters);
  });
});
