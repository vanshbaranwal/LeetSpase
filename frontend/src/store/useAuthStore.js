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
      console.log("Error signing up", error);
      toast.error("Error signing up");
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
      console.log("Error logging in", error);
      toast.error("Error logging in");
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
