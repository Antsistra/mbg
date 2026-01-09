import { createBrowserRouter, Navigate } from "react-router-dom";

import { Register } from "@/pages/Register";
import Dashboard from "./pages/Dashboard";
import Visualisasi from "./pages/clustering/Visualisasi";
import DaftarMenu from "./pages/menu/DaftarMenu";
import SusunMenu from "./pages/menu/SusunMenu";
import DetailMenu from "./pages/menu/DetailMenu";
import CompareMenu from "./pages/menu/CompareMenu";
import DaftarBahan from "./pages/bahan-pangan/DaftarBahan";
import CompareFoodItems from "./pages/bahan-pangan/CompareFoodItems";
import StandarGizi from "./pages/pengaturan/StandarGizi";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import LoginPage from "./pages/Login";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/register",
    element: <Register />,
  },
  {
    // Protected routes
    element: <ProtectedRoute />,
    children: [
      {
        path: "/dashboard",
        element: <Dashboard />,
      },
      {
        path: "/clustering/visualisasi",
        element: <Visualisasi />,
      },
      // Menu routes
      {
        path: "/menu",
        element: <DaftarMenu />,
      },
      {
        path: "/menu/susun",
        element: <SusunMenu />,
      },
      {
        path: "/menu/edit/:menuId",
        element: <SusunMenu />,
      },
      {
        path: "/menu/lihat/:menuId",
        element: <DetailMenu />,
      },
      {
        path: "/menu/bandingkan",
        element: <CompareMenu />,
      },
      // Bahan Pangan routes
      {
        path: "/bahan-pangan",
        element: <DaftarBahan />,
      },
      {
        path: "/bahan-pangan/bandingkan",
        element: <CompareFoodItems />,
      },
      // Pengaturan routes
      {
        path: "/pengaturan/standar-gizi",
        element: <StandarGizi />,
      },
    ],
  },
]);
