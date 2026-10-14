import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";

export const useAdminStore = create((set, get) => ({
    overview: null,
    users: [],
    submissions: [],
    system: null,
    isLoading: false,
    isUpdatingUser: false,
    updatingUserId: null,

    fetchDashboard: async () => {
        set({ isLoading: true });

        try {
            const [overviewResponse, usersResponse, submissionsResponse, systemResponse] = await Promise.all([
                axiosInstance.get("/admin/overview"),
                axiosInstance.get("/admin/users"),
                axiosInstance.get("/admin/submissions"),
                axiosInstance.get("/admin/system-status"),
            ]);

            set({
                overview: overviewResponse.data.overview,
                users: usersResponse.data.users,
                submissions: submissionsResponse.data.submissions,
                system: systemResponse.data.system,
            });
        } catch (error) {
            toast.error(error.response?.data?.error || "Failed to load the admin dashboard");
        } finally {
            set({ isLoading: false });
        }
    },

    refreshSystemStatus: async () => {
        try {
            const response = await axiosInstance.get("/admin/system-status");
            set({ system: response.data.system });
        } catch (error) {
            toast.error(error.response?.data?.error || "Failed to refresh system status");
        }
    },

    updateUserRole: async (userId, role) => {
        set({ isUpdatingUser: true, updatingUserId: userId });

        try {
            await axiosInstance.patch(`/admin/users/${userId}/role`, { role });
            set({
                users: get().users.map((user) => user.id === userId ? { ...user, role } : user),
            });
            toast.success(role === "ADMIN" ? "Admin access granted" : "Admin access removed");
            return true;
        } catch (error) {
            toast.error(error.response?.data?.error || "Failed to update user role");
            return false;
        } finally {
            set({ isUpdatingUser: false, updatingUserId: null });
        }
    },

    updateUserStatus: async (userId, status) => {
        set({ isUpdatingUser: true, updatingUserId: userId });

        try {
            await axiosInstance.patch(`/admin/users/${userId}/status`, { status });
            set({
                users: get().users.map((user) => user.id === userId ? { ...user, status } : user),
            });
            toast.success(status === "ACTIVE" ? "User activated" : "User suspended");
        } catch (error) {
            toast.error(error.response?.data?.error || "Failed to update user status");
        } finally {
            set({ isUpdatingUser: false, updatingUserId: null });
        }
    },
}));
