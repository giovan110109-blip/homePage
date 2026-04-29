<script setup lang="ts">
import { reactive } from "vue";
import { ElMessage } from "element-plus";
import Modal from "@/components/ui/Modal.vue";
import AppButton from "@/components/ui/AppButton.vue";
import { useAuthStore } from "@/stores/auth";
import { useAuthUiStore } from "@/stores/authUi";
import { buildAdminSsoUrl } from "@/utils/admin";

const authStore = useAuthStore();
const authUiStore = useAuthUiStore();

const form = reactive({
  username: "",
  password: "",
});
const submitting = ref(false);

const resetForm = () => {
  form.password = "";
};

const handleCancel = () => {
  authUiStore.closeLoginModal();
  authUiStore.resetPostLoginAction();
  resetForm();
};

const handleLogin = async () => {
  if (!form.username || !form.password) {
    ElMessage.warning("请输入账号和密码");
    return;
  }

  if (submitting.value) return;
  submitting.value = true;

  try {
    const data = await authStore.login(form.username, form.password);
    ElMessage.success("登录成功");

    const shouldRedirectToAdmin = authUiStore.redirectToAdminAfterLogin;
    authUiStore.closeLoginModal();
    authUiStore.resetPostLoginAction();
    resetForm();

    if (shouldRedirectToAdmin) {
      window.location.href = buildAdminSsoUrl(data?.token || authStore.token);
    }
  } catch (error) {
    const message = (error as any)?.message || "登录失败，请稍后再试";
    ElMessage.error(message);
  } finally {
    submitting.value = false;
  }
};
</script>

<template>
  <Modal
    v-model="authUiStore.loginModalOpen"
    title="后台登录"
    size="md"
    @close="resetForm"
  >
    <div class="login-modal">
      <form class="login-form" @submit.prevent="handleLogin">
        <div class="login-field">
          <label class="sr-only" for="admin-username">账号</label>
          <input
            id="admin-username"
            v-model.trim="form.username"
            type="text"
            autocomplete="username"
            class="login-input"
            placeholder="账号"
          />
        </div>

        <div class="login-field">
          <label class="sr-only" for="admin-password">密码</label>
          <input
            id="admin-password"
            v-model="form.password"
            type="password"
            autocomplete="current-password"
            class="login-input"
            placeholder="密码"
          />
        </div>

        <div class="login-actions">
          <AppButton
            variant="ghost"
            class="login-cancel"
            @click="handleCancel"
          >
            取消
          </AppButton>
          <AppButton
            variant="primary"
            nativeType="submit"
            :disabled="submitting"
            class="login-submit"
          >
            {{ submitting ? "登录中..." : "登录" }}
          </AppButton>
        </div>
      </form>
    </div>
  </Modal>
</template>

<style scoped>
.login-modal {
  width: 100%;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.login-field {
  display: flex;
}

.login-input {
  width: 100%;
  height: 3.5rem;
  border-radius: 1.1rem;
  border: 1px solid var(--theme-border);
  background:
    linear-gradient(
      180deg,
      color-mix(in srgb, var(--theme-surface-strong) 92%, white 8%) 0%,
      var(--theme-surface-soft) 100%
    );
  padding: 0 1rem;
  font-size: 1rem;
  color: var(--theme-text-primary);
  outline: none;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    background-color 0.2s ease;
}

.login-input::placeholder {
  color: var(--theme-text-muted);
}

.login-input:focus {
  border-color: var(--theme-accent);
  box-shadow: 0 0 0 4px var(--theme-accent-soft);
  background: var(--theme-surface-strong);
}

.login-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.25rem;
}

.login-cancel {
  min-width: 4.5rem;
  box-shadow: none;
}

.login-submit {
  min-width: 7.5rem;
  border-radius: 1rem;
}

@media (max-width: 640px) {
  .login-actions {
    justify-content: space-between;
  }

  .login-submit {
    min-width: 6.5rem;
  }
}
</style>
