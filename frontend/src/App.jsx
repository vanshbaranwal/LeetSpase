import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import HomePage from "./page/HomePage";
import LoginPage from "./page/LoginPage";
import SignUpPage from "./page/SignUpPage";
import { useAuthStore } from "./store/useAuthStore";
import { Loader } from "lucide-react";
import Layout from "./layout/Layout";
import AdminRoute from "./components/AdminRoute";
import AddProblem from "./page/AddProblem";
import ProblemPage from "./page/ProblemPage";
import ProblemsPage from "./page/ProblemsPage";
import AdminDashboard from "./page/AdminDashboard";
import ProfilePage from "./page/ProfilePage";

const App = () => {
  const { authUser, checkAuth, isCheckingAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isCheckingAuth && !authUser) {
    return (
      <div className="flex min-h-dvh items-center justify-center" role="status" aria-label="Loading LeetSpase">
        <Loader className="size-8 animate-spin text-white/60" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-start">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: "#151515",
            color: "#ffffff",
            border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: "14px",
            boxShadow: "0 18px 50px rgba(0,0,0,0.45)",
          },
        }}
      />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route
            index
            element={<HomePage />}
          />
          <Route
            path="problems"
            element={<ProblemsPage />}
          />
        </Route>

        <Route
          path="/login"
          element={!authUser ? <LoginPage /> : <Navigate to="/problems" />}
        />

        <Route
          path="/signup"
          element={!authUser ? <SignUpPage /> : <Navigate to="/problems" />}
        />

        <Route
          path="/problem/:id"
          element={authUser ? <ProblemPage /> : <Navigate to={"/login"} />}
        />

        <Route
          path="/profile"
          element={authUser ? <ProfilePage /> : <Navigate to="/login" />}
        />

        <Route element={<AdminRoute />}>
          <Route
            path="/admin"
            element={<AdminDashboard />}
          />
          <Route
            path="/add-problem"
            element={authUser ? <AddProblem /> : <Navigate to="/" />}
          />
        </Route>
      </Routes>
    </div>
  );
};

export default App;
