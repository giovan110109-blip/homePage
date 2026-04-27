import { defineStore } from "pinia";

interface OpenLoginOptions {
  redirectToAdmin?: boolean;
}

export const useAuthUiStore = defineStore("auth-ui", {
  state: () => ({
    loginModalOpen: false as boolean,
    redirectToAdminAfterLogin: false as boolean,
  }),

  actions: {
    openLoginModal(options: OpenLoginOptions = {}) {
      this.loginModalOpen = true;
      this.redirectToAdminAfterLogin = Boolean(options.redirectToAdmin);
    },

    closeLoginModal() {
      this.loginModalOpen = false;
    },

    resetPostLoginAction() {
      this.redirectToAdminAfterLogin = false;
    },
  },
});
