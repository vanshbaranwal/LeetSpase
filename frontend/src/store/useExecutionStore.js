import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";



const getErrorMessage = (error, fallback) =>
    error.response?.data?.error || fallback;

export const useExecutionStore = create((set) => ({
    isRunning: false,
    isSubmitting: false,
    result: null,
    lastAction: null,

    runCode: async(source_code, language_id, problemId) => {
        try {
            set({ isRunning: true });
            const response = await axiosInstance.post("/execute-code/run", {
                source_code,
                language_id,
                problemId
            });

            set({ result: response.data.result, lastAction: "run" });
            toast.success(response.data.message);
            return true;
        } catch (error) {
            console.error("Error running code", error);
            toast.error(getErrorMessage(error, "Error running code"));
            return false;
        } finally {
            set({ isRunning: false });
        }
    },

    submitCode: async(source_code, language_id, problemId) => {
        try {
            set({ isSubmitting: true });
            const response = await axiosInstance.post("/execute-code/submit", {
                source_code,
                language_id,
                problemId
            });

            set({ result: response.data.result, lastAction: "submit" });
            toast.success(response.data.message);
            return true;
        } catch (error) {
            console.error("Error submitting code", error);
            toast.error(getErrorMessage(error, "Error submitting code"));
            return false;
        } finally {
            set({ isSubmitting: false });
        }
    },

    clearResult: () => set({ result: null, lastAction: null })
}));
