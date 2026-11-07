import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

let activeAuthCheck = null;

export const useAuthStore = create((set) => ({
  authUser: null,
  isSigninUp: false,
  isLoggingIn: false,
  isGoogleLoggingIn: false,
  isCheckingAuth: true,

  updateAuthUser: (updates) => set((state) => ({
    authUser: state.authUser ? { ...state.authUser, ...updates } : state.authUser,
  })),

  clearAuthUser: () => set({ authUser: null }),

  checkAuth: () => {
    if (activeAuthCheck) return activeAuthCheck;

    set({ isCheckingAuth: true });
    activeAuthCheck = axiosInstance
      .get("/auth/check")
      .then((res) => {
        console.log("checkauth response", res.data);
        set({ authUser: res.data.user });
      })
      .catch((error) => {
        console.log("❌ Error checking auth:", error);
        set({ authUser: null });
      })
      .finally(() => {
        set({ isCheckingAuth: false });
        activeAuthCheck = null;
      });

    return activeAuthCheck;
  },

  signup: async (data) => {
    set({ isSigninUp: true });
    try {
      const res = await axiosInstance.post("/auth/register", data);

      set({ authUser: res.data.user });

      toast.success(res.data.message);
    } catch (error) {
      if (error.response?.status === 400 && error.response.data?.error === "user already exists") {
        return "An account already uses this email. Sign in or try a different address.";
      }
      return "We couldn’t create your account. Please try again.";
    } finally {
      set({ isSigninUp: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);

      set({ authUser: res.data.user });

      toast.success(res.data.message);
    } catch (error) {
      if (error.response?.status === 401) return "Email or password is incorrect. Check your details and try again.";
      if (error.response?.status === 403) return "This account has been suspended.";
      return "We couldn’t sign you in. Please try again.";
    } finally {
      set({ isLoggingIn: false });
    }
  },

  googleLogin: async (credential) => {
    set({ isGoogleLoggingIn: true });

    try {
      const res = await axiosInstance.post("/auth/google", { credential });

      set({ authUser: res.data.user });
      toast.success(res.data.message);
      return true;
    } catch (error) {
      console.error("Error logging in with Google", error);
      toast.error(error.response?.data?.error || "Google login failed");
      return false;
    } finally {
      set({ isGoogleLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      set({ authUser: null });

      toast.success("Logout successful");
      return true;
    } catch (error) {
      console.log("Error logging out", error);
      toast.error("Error logging out");
      return false;
    }
  },
}));
