import type { ButtonProps } from "@nuxt/ui";
import type { MaybeRefOrGetter } from "vue";
import { toValue } from "vue";

export const useDashboardNavbar = () => {
  const actions = useState<ButtonProps[]>("dashboard-navbar-actions", () => []);
  const activeRegistration = useState<number>("dashboard-navbar-actions-registration", () => 0);

  const setActions = (newActions: MaybeRefOrGetter<ButtonProps[]>) => {
    const registrationId = activeRegistration.value + 1;
    activeRegistration.value = registrationId;

    watchEffect(() => {
      if (activeRegistration.value !== registrationId) return;
      actions.value = toValue(newActions);
    });

    onScopeDispose(() => {
      if (activeRegistration.value !== registrationId) return;
      activeRegistration.value = 0;
      actions.value = [];
    });
  };

  return {
    actions,
    setActions,
  };
};
