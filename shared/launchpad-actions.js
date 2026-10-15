const launchpadActions = (() => {
  "use strict";

  const PORTLET_ID = "warthog-launchpad-actions";
  const ACTIONS_SELECTOR = "#global-actions > ul";

  function getActionsContainer() {
    const actions = document.querySelector(ACTIONS_SELECTOR);
    if (actions) return actions;

    const sidebar = document.querySelector("#side-portlets");
    if (!sidebar) return null;

    let portlet = document.getElementById(PORTLET_ID);
    if (!portlet || portlet.parentElement !== sidebar) {
      portlet?.remove();
      portlet = document.createElement("div");
      portlet.id = PORTLET_ID;
      portlet.className = "portlet";

      const heading = document.createElement("h2");
      heading.textContent = "Actions";
      portlet.append(heading, document.createElement("ul"));
      sidebar.prepend(portlet);
    }

    return portlet.querySelector("ul");
  }

  function register({ id, isActive, createAction, updateAction }) {
    function refresh() {
      const existing = document.getElementById(id);
      const actions = isActive() ? getActionsContainer() : null;

      if (actions) {
        const item = existing || createAction();
        item.id = id;
        updateAction?.(item);
        if (item.parentElement !== actions) actions.append(item);
      } else {
        existing?.remove();
      }

      // Another userscript may still have an action in the shared portlet.
      const portlet = document.getElementById(PORTLET_ID);
      if (portlet && !portlet.querySelector("li")) portlet.remove();
    }

    let scheduled = false;
    function scheduleRefresh() {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => {
        scheduled = false;
        refresh();
      });
    }

    new MutationObserver(scheduleRefresh).observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
    window.addEventListener("popstate", scheduleRefresh);
    window.addEventListener("pageshow", scheduleRefresh);
    refresh();
  }

  return { register };
})();
