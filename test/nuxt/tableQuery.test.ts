import { afterEach, describe, expect, it, vi } from "vitest";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { flushPromises, type VueWrapper } from "@vue/test-utils";
import { useRouter } from "#app";
import Harness from "../fixtures/TableQuery.vue";

describe("Nuxt UI table URL integration", () => {
  let wrapper: VueWrapper<InstanceType<typeof Harness>>;
  afterEach(() => wrapper?.unmount());

  it("renders shared sorting and filters, then updates the URL through the table controls", async () => {
    wrapper = await mountSuspended(Harness, {route: "/?sort=-name&caution=paid&keep=yes#table"});
    await flushPromises();
    const renderedNames = () => wrapper.findAll("tbody tr").map(row => row.findAll("td")[0]!.text());
    expect(renderedNames()).toEqual(["Carol", "Alice"]);

    const table = wrapper.vm.table!.tableApi;
    table.getColumn("name")!.toggleSorting(false);
    table.getColumn("caution")!.setFilterValue("NOT_PAID");
    await flushPromises();
    expect(renderedNames()).toEqual(["Bob"]);
    const router = useRouter();
    await vi.waitFor(() => expect(router.currentRoute.value.query).toEqual({sort: "name", caution: "NOT_PAID", keep: "yes"}));
    expect(router.currentRoute.value.hash).toBe("#table");

    await router.push("/?sort=-name&search=ali");
    await flushPromises();
    expect(renderedNames()).toEqual(["Alice"]);
    await router.push("/");
    await flushPromises();
    expect(renderedNames()).toEqual(["Alice", "Bob", "Carol"]);
  });
});
