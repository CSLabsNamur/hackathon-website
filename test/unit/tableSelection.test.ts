import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { computed, effectScope, nextTick, ref, watch } from "vue";
import { useTableSelection } from "../../app/composables/useTableSelection";

describe("bulk table selection", () => {
  const scopes: ReturnType<typeof effectScope>[] = [];
  beforeEach(() => {
    vi.stubGlobal("ref", ref);
    vi.stubGlobal("computed", computed);
    vi.stubGlobal("watch", watch);
  });
  afterEach(() => {
    scopes.splice(0).forEach((scope) => scope.stop());
    vi.unstubAllGlobals();
  });

  it("keeps stable selected IDs across refreshes and removes deleted records", async () => {
    const scope = effectScope();
    scopes.push(scope);
    const items = ref([{id: "first"}, {id: "second"}]);
    const state = scope.run(() => useTableSelection(items, ref("")))!;
    state.rowSelection.value = {first: true, second: false};
    items.value = [{id: "second"}, {id: "first"}];
    await nextTick();
    expect(state.selectedItems.value).toEqual([{id: "first"}]);
    items.value = [{id: "second"}];
    await nextTick();
    expect(state.rowSelection.value).toEqual({});
  });

  it("clears selection when search or column filters change", async () => {
    const scope = effectScope();
    scopes.push(scope);
    const search = ref("");
    const state = scope.run(() => useTableSelection(ref([{id: "first"}]), search))!;
    state.rowSelection.value = {first: true};
    search.value = "filtered";
    await nextTick();
    expect(state.selectedItems.value).toEqual([]);
    state.rowSelection.value = {first: true};
    state.columnFilters.value = [{id: "status", value: "PAID"}];
    await nextTick();
    expect(state.selectedItems.value).toEqual([]);
  });

  it("uses external column filters and clears selection when they change", async () => {
    const scope = effectScope();
    scopes.push(scope);
    const filters = ref([{id: "caution", value: "PAID"}]);
    const state = scope.run(() => useTableSelection(ref([{id: "first"}]), ref(""), filters))!;
    expect(state.columnFilters).toBe(filters);
    state.rowSelection.value = {first: true};
    filters.value = [{id: "caution", value: "NOT_PAID"}];
    await nextTick();
    expect(state.selectedItems.value).toEqual([]);
  });
});
