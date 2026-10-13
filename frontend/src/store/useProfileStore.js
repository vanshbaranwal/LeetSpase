import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useProfileStore = create((set, get) => ({
  profile: null,
  stats: null,
  progress: null,
  topTags: [],
  recentSubmissions: [],
  activity: [],
  playlists: [],
  isLoading: false,
  isSaving: false,

  fetchProfile: async () => {
    set({ isLoading: true });

    try {
      const response = await axiosInstance.get("/profile");
      set({
        profile: response.data.profile,
        stats: response.data.stats,
        progress: response.data.progress,
        topTags: response.data.topTags,
        recentSubmissions: response.data.recentSubmissions,
        activity: response.data.activity,
        playlists: response.data.playlists,
      });
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to load your profile");
    } finally {
      set({ isLoading: false });
    }
  },

  updateProfile: async (values) => {
    set({ isSaving: true });

    try {
      const response = await axiosInstance.patch("/profile", values);
      set({ profile: { ...get().profile, ...response.data.user } });
      useAuthStore.getState().updateAuthUser(response.data.user);
      toast.success(response.data.message);
      return true;
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to update profile");
      return false;
    } finally {
      set({ isSaving: false });
    }
  },

  changePassword: async (values) => {
    set({ isSaving: true });

    try {
      const response = await axiosInstance.patch("/profile/password", values);
      toast.success(response.data.message);
      return true;
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to change password");
      return false;
    } finally {
      set({ isSaving: false });
    }
  },

  updatePlaylist: async (playlistId, values) => {
    set({ isSaving: true });

    try {
      const response = await axiosInstance.patch(`/playlist/${playlistId}`, values);
      set({
        playlists: get().playlists.map((playlist) => playlist.id === playlistId
          ? { ...playlist, ...response.data.playlist }
          : playlist),
      });
      toast.success(response.data.message);
      return true;
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to update playlist");
      return false;
    } finally {
      set({ isSaving: false });
    }
  },

  deletePlaylist: async (playlistId) => {
    set({ isSaving: true });

    try {
      await axiosInstance.delete(`/playlist/${playlistId}`);
      set({ playlists: get().playlists.filter((playlist) => playlist.id !== playlistId) });
      toast.success("Playlist deleted");
      return true;
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to delete playlist");
      return false;
    } finally {
      set({ isSaving: false });
    }
  },

  deleteAccount: async (values) => {
    set({ isSaving: true });

    try {
      const response = await axiosInstance.delete("/profile", { data: values });
      useAuthStore.getState().clearAuthUser();
      toast.success(response.data.message);
      return true;
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to delete account");
      return false;
    } finally {
      set({ isSaving: false });
    }
  },
}));
