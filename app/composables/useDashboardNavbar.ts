import type { ButtonProps } from "@nuxt/ui";
import type { MaybeRefOrGetter } from "vue";
import { toValue } from "vue";

export const useDashboardNavbar = () => {
  const actions = useState<ButtonProps[]>("dashboard-navbar-actions", () => []);

  const setActions = (newActions: MaybeRefOrGetter<ButtonProps[]>) => {
    watchEffect(() => {
      actions.value = toValue(newActions);
    });

    onScopeDispose(() => {
      actions.value = [];
    });
  };

  return {
    actions,
    setActions,
  };
};
