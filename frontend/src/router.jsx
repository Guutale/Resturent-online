import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import AdminLayout from "./components/AdminLayout";
import DeliveryRoute from "./components/DeliveryRoute";
import DeliveryLayout from "./components/DeliveryLayout";
import ChefRoute from "./components/ChefRoute";
import ChefLayout from "./components/ChefLayout";
import DispatcherRoute from "./components/DispatcherRoute";
import DispatcherLayout from "./components/DispatcherLayout";
import HRRoute from "./components/HRRoute";
import HRLayout from "./components/HRLayout";
import FinanceRoute from "./components/FinanceRoute";
import FinanceLayout from "./components/FinanceLayout";
import HomePage from "./pages/HomePage";
import MenuPage from "./pages/MenuPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProfilePage from "./pages/ProfilePage";
import OrdersPage from "./pages/OrdersPage";
import OrderDetailPage from "./pages/OrderDetailPage";
import NotificationsPage from "./pages/NotificationsPage";
import AdminLoginPage from "./pages/admin/AdminLoginPage";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminHeroSlidesPage from "./pages/admin/AdminHeroSlidesPage";
import AdminHomepageManagementPage from "./pages/admin/AdminHomepageManagementPage";
import AdminCategoriesPage from "./pages/admin/AdminCategoriesPage";
import AdminProductsPage from "./pages/admin/AdminProductsPage";
import AdminOrdersPage from "./pages/admin/AdminOrdersPage";
import AdminOrderDetailPage from "./pages/admin/AdminOrderDetailPage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminUserDetailPage from "./pages/admin/AdminUserDetailPage";
import AdminPaymentsPage from "./pages/admin/AdminPaymentsPage";
import AdminNotificationsPage from "./pages/admin/AdminNotificationsPage";
import AdminStaffPage from "./pages/admin/AdminStaffPage";
import AdminPayrollPage from "./pages/admin/AdminPayrollPage";
import DeliveryOrdersPage from "./pages/delivery/DeliveryOrdersPage";
import ChefOrdersPage from "./pages/chef/ChefOrdersPage";
import DispatcherOrdersPage from "./pages/dispatcher/DispatcherOrdersPage";
import DispatcherDeliveryStaffPage from "./pages/dispatcher/DispatcherDeliveryStaffPage";
import HRDashboardPage from "./pages/hr/HRDashboardPage";
import HRStaffPage from "./pages/hr/HRStaffPage";
import HRStaffDetailPage from "./pages/hr/HRStaffDetailPage";
import HRAttendancePage from "./pages/hr/HRAttendancePage";
import HRSalaryStructuresPage from "./pages/hr/HRSalaryStructuresPage";
import FinanceDashboardPage from "./pages/finance/FinanceDashboardPage";
import FinancePayrollPage from "./pages/finance/FinancePayrollPage";

const AppRouter = () => (
  <Routes>
    <Route element={<AppLayout />}>
      <Route path="/" element={<HomePage />} />
      <Route path="/menu" element={<MenuPage />} />
      <Route path="/menu/:id" element={<ProductDetailPage />} />
      <Route path="/cart" element={<CartPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
      <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
      <Route path="/orders/:id" element={<ProtectedRoute><OrderDetailPage /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
    </Route>

    <Route path="/admin/login" element={<AdminLoginPage />} />
    <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
      <Route index element={<AdminDashboardPage />} />
      <Route path="homepage" element={<AdminHomepageManagementPage />} />
      <Route path="hero-slides" element={<AdminHeroSlidesPage />} />
      <Route path="categories" element={<AdminCategoriesPage />} />
      <Route path="products" element={<AdminProductsPage />} />
      <Route path="orders" element={<AdminOrdersPage />} />
      <Route path="orders/:id" element={<AdminOrderDetailPage />} />
      <Route path="users" element={<AdminUsersPage />} />
      <Route path="users/:id" element={<AdminUserDetailPage />} />
      <Route path="staff" element={<AdminStaffPage />} />
      <Route path="payroll" element={<AdminPayrollPage />} />
      <Route path="payments" element={<AdminPaymentsPage />} />
      <Route path="notifications" element={<AdminNotificationsPage />} />
    </Route>

    <Route path="/chef" element={<ChefRoute><ChefLayout /></ChefRoute>}>
      <Route index element={<ChefOrdersPage />} />
    </Route>

    <Route path="/dispatcher" element={<DispatcherRoute><DispatcherLayout /></DispatcherRoute>}>
      <Route index element={<DispatcherOrdersPage />} />
      <Route path="delivery-staff" element={<DispatcherDeliveryStaffPage />} />
    </Route>

    <Route path="/hr" element={<HRRoute><HRLayout /></HRRoute>}>
      <Route index element={<HRDashboardPage />} />
      <Route path="homepage" element={<AdminHomepageManagementPage />} />
      <Route path="hero-slides" element={<AdminHeroSlidesPage />} />
      <Route path="staff" element={<HRStaffPage />} />
      <Route path="staff/:id" element={<HRStaffDetailPage />} />
      <Route path="attendance" element={<HRAttendancePage />} />
      <Route path="salary-structures" element={<HRSalaryStructuresPage />} />
    </Route>

    <Route path="/finance" element={<FinanceRoute><FinanceLayout /></FinanceRoute>}>
      <Route index element={<FinanceDashboardPage />} />
      <Route path="payroll" element={<FinancePayrollPage />} />
    </Route>

    <Route path="/delivery" element={<DeliveryRoute><DeliveryLayout /></DeliveryRoute>}>
      <Route index element={<DeliveryOrdersPage />} />
    </Route>

    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default AppRouter;
