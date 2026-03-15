import React, { Suspense, lazy } from "react";
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
import WaiterRoute from "./components/WaiterRoute";
import WaiterLayout from "./components/WaiterLayout";
import HomePage from "./pages/HomePage";
import MenuPage from "./pages/MenuPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import CartPage from "./pages/CartPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import UnauthorizedPage from "./pages/UnauthorizedPage";

const CheckoutPage = lazy(() => import("./pages/CheckoutPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const OrdersPage = lazy(() => import("./pages/OrdersPage"));
const OrderDetailPage = lazy(() => import("./pages/OrderDetailPage"));
const NotificationsPage = lazy(() => import("./pages/NotificationsPage"));
const AdminLoginPage = lazy(() => import("./pages/admin/AdminLoginPage"));
const AdminDashboardPage = lazy(() => import("./pages/admin/AdminDashboardPage"));
const AdminHeroSlidesPage = lazy(() => import("./pages/admin/AdminHeroSlidesPage"));
const AdminHomepageManagementPage = lazy(() => import("./pages/admin/AdminHomepageManagementPage"));
const AdminAccountingOverviewPage = lazy(() => import("./pages/admin/AdminAccountingOverviewPage"));
const AdminCategoriesPage = lazy(() => import("./pages/admin/AdminCategoriesPage"));
const AdminProductsPage = lazy(() => import("./pages/admin/AdminProductsPage"));
const AdminOrdersPage = lazy(() => import("./pages/admin/AdminOrdersPage"));
const AdminOrderDetailPage = lazy(() => import("./pages/admin/AdminOrderDetailPage"));
const AdminReportsPage = lazy(() => import("./pages/admin/AdminReportsPage"));
const AdminUsersPage = lazy(() => import("./pages/admin/AdminUsersPage"));
const AdminUserDetailPage = lazy(() => import("./pages/admin/AdminUserDetailPage"));
const AdminPaymentsPage = lazy(() => import("./pages/admin/AdminPaymentsPage"));
const AdminNotificationsPage = lazy(() => import("./pages/admin/AdminNotificationsPage"));
const AdminStaffPage = lazy(() => import("./pages/admin/AdminStaffPage"));
const AdminPayrollPage = lazy(() => import("./pages/admin/AdminPayrollPage"));
const AdminAuthBrandingPage = lazy(() => import("./pages/admin/AdminAuthBrandingPage"));
const DashboardSettingsPage = lazy(() => import("./pages/dashboard/DashboardSettingsPage"));
const DeliveryDashboardPage = lazy(() => import("./pages/delivery/DeliveryDashboardPage"));
const DeliveryHistoryPage = lazy(() => import("./pages/delivery/DeliveryHistoryPage"));
const DeliveryOrdersPage = lazy(() => import("./pages/delivery/DeliveryOrdersPage"));
const ChefDashboardPage = lazy(() => import("./pages/chef/ChefDashboardPage"));
const ChefPreparingOrdersPage = lazy(() => import("./pages/chef/ChefPreparingOrdersPage"));
const ChefCompletedOrdersPage = lazy(() => import("./pages/chef/ChefCompletedOrdersPage"));
const ChefNotesPage = lazy(() => import("./pages/chef/ChefNotesPage"));
const ChefOrdersPage = lazy(() => import("./pages/chef/ChefOrdersPage"));
const DispatcherOrdersPage = lazy(() => import("./pages/dispatcher/DispatcherOrdersPage"));
const DispatcherDeliveryStaffPage = lazy(() => import("./pages/dispatcher/DispatcherDeliveryStaffPage"));
const HRDashboardPage = lazy(() => import("./pages/hr/HRDashboardPage"));
const HRStaffPage = lazy(() => import("./pages/hr/HRStaffPage"));
const HRStaffDetailPage = lazy(() => import("./pages/hr/HRStaffDetailPage"));
const HRAttendancePage = lazy(() => import("./pages/hr/HRAttendancePage"));
const HRRolesAssignmentsPage = lazy(() => import("./pages/hr/HRRolesAssignmentsPage"));
const HRSalaryStructuresPage = lazy(() => import("./pages/hr/HRSalaryStructuresPage"));
const HRStaffNotesPage = lazy(() => import("./pages/hr/HRStaffNotesPage"));
const FinanceDashboardPage = lazy(() => import("./pages/finance/FinanceDashboardPage"));
const FinanceDiscountImpactPage = lazy(() => import("./pages/finance/FinanceDiscountImpactPage"));
const FinanceExpensesPage = lazy(() => import("./pages/finance/FinanceExpensesPage"));
const FinancePaymentsPage = lazy(() => import("./pages/finance/FinancePaymentsPage"));
const FinanceReportsPage = lazy(() => import("./pages/finance/FinanceReportsPage"));
const FinanceRevenuePage = lazy(() => import("./pages/finance/FinanceRevenuePage"));
const WaiterDashboardPage = lazy(() => import("./pages/waiter/WaiterDashboardPage"));
const WaiterNewOrderPage = lazy(() => import("./pages/waiter/WaiterNewOrderPage"));
const WaiterOrdersPage = lazy(() => import("./pages/waiter/WaiterOrdersPage"));
const WaiterTablesPage = lazy(() => import("./pages/waiter/WaiterTablesPage"));

const RouteLoadingFallback = () => (
  <div className="route-loading-fallback" role="status" aria-live="polite">
    <div className="route-loading-card">
      <span className="section-kicker">Loading</span>
      <strong>Preparing the next view...</strong>
    </div>
  </div>
);

const renderLazy = (LazyComponent, props = {}) => (
  <Suspense fallback={<RouteLoadingFallback />}>
    <LazyComponent {...props} />
  </Suspense>
);

const AppRouter = () => (
  <Routes>
    <Route element={<AppLayout />}>
      <Route path="/" element={<HomePage />} />
      <Route path="/menu" element={<MenuPage />} />
      <Route path="/menu/:id" element={<ProductDetailPage />} />
      <Route path="/cart" element={<CartPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/profile" element={<ProtectedRoute>{renderLazy(ProfilePage)}</ProtectedRoute>} />
      <Route path="/checkout" element={<ProtectedRoute>{renderLazy(CheckoutPage)}</ProtectedRoute>} />
      <Route path="/orders" element={<ProtectedRoute>{renderLazy(OrdersPage)}</ProtectedRoute>} />
      <Route path="/orders/:id" element={<ProtectedRoute>{renderLazy(OrderDetailPage)}</ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute>{renderLazy(NotificationsPage)}</ProtectedRoute>} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
    </Route>

    <Route path="/admin/login" element={renderLazy(AdminLoginPage)} />
    <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
      <Route index element={renderLazy(AdminDashboardPage)} />
      <Route path="homepage" element={renderLazy(AdminHomepageManagementPage)} />
      <Route path="auth-branding" element={renderLazy(AdminAuthBrandingPage)} />
      <Route path="hero-slides" element={renderLazy(AdminHeroSlidesPage)} />
      <Route path="categories" element={renderLazy(AdminCategoriesPage)} />
      <Route path="products" element={renderLazy(AdminProductsPage)} />
      <Route path="orders" element={renderLazy(AdminOrdersPage)} />
      <Route path="orders/:id" element={renderLazy(AdminOrderDetailPage)} />
      <Route path="users" element={renderLazy(AdminUsersPage)} />
      <Route path="users/:id" element={renderLazy(AdminUserDetailPage)} />
      <Route path="staff" element={renderLazy(AdminStaffPage)} />
      <Route path="payroll" element={renderLazy(AdminPayrollPage)} />
      <Route path="payments" element={renderLazy(AdminPaymentsPage)} />
      <Route path="delivery-management" element={renderLazy(DispatcherOrdersPage)} />
      <Route path="accounting-overview" element={renderLazy(AdminAccountingOverviewPage)} />
      <Route path="reports" element={renderLazy(AdminReportsPage)} />
      <Route path="settings" element={renderLazy(DashboardSettingsPage)} />
      <Route path="notifications" element={renderLazy(AdminNotificationsPage)} />
    </Route>

    <Route path="/chef" element={<ChefRoute><ChefLayout /></ChefRoute>}>
      <Route index element={renderLazy(ChefDashboardPage)} />
      <Route path="queue" element={renderLazy(ChefOrdersPage)} />
      <Route path="preparing" element={renderLazy(ChefPreparingOrdersPage)} />
      <Route path="completed" element={renderLazy(ChefCompletedOrdersPage)} />
      <Route path="notes" element={renderLazy(ChefNotesPage)} />
      <Route path="settings" element={renderLazy(DashboardSettingsPage)} />
    </Route>

    <Route path="/dispatcher" element={<DispatcherRoute><DispatcherLayout /></DispatcherRoute>}>
      <Route index element={renderLazy(DispatcherOrdersPage)} />
      <Route path="delivery-staff" element={renderLazy(DispatcherDeliveryStaffPage)} />
    </Route>

    <Route path="/hr" element={<HRRoute><HRLayout /></HRRoute>}>
      <Route index element={renderLazy(HRDashboardPage)} />
      <Route path="homepage" element={renderLazy(AdminHomepageManagementPage)} />
      <Route path="hero-slides" element={renderLazy(AdminHeroSlidesPage)} />
      <Route path="staff" element={renderLazy(HRStaffPage)} />
      <Route path="staff/:id" element={renderLazy(HRStaffDetailPage)} />
      <Route path="roles" element={renderLazy(HRRolesAssignmentsPage)} />
      <Route path="attendance" element={renderLazy(HRAttendancePage)} />
      <Route path="notes" element={renderLazy(HRStaffNotesPage)} />
      <Route path="salary-structures" element={renderLazy(HRSalaryStructuresPage)} />
      <Route path="settings" element={renderLazy(DashboardSettingsPage)} />
    </Route>

    <Route path="/finance" element={<FinanceRoute><FinanceLayout /></FinanceRoute>}>
      <Route index element={renderLazy(FinanceDashboardPage)} />
      <Route path="payments" element={renderLazy(FinancePaymentsPage)} />
      <Route path="revenue" element={renderLazy(FinanceRevenuePage)} />
      <Route path="expenses" element={renderLazy(FinanceExpensesPage)} />
      <Route path="reports" element={renderLazy(FinanceReportsPage)} />
      <Route path="discounts" element={renderLazy(FinanceDiscountImpactPage)} />
      <Route path="settings" element={renderLazy(DashboardSettingsPage)} />
    </Route>

    <Route path="/delivery" element={<DeliveryRoute><DeliveryLayout /></DeliveryRoute>}>
      <Route index element={renderLazy(DeliveryDashboardPage)} />
      <Route path="assigned" element={renderLazy(DeliveryOrdersPage)} />
      <Route path="history" element={renderLazy(DeliveryHistoryPage)} />
      <Route path="settings" element={renderLazy(DashboardSettingsPage)} />
    </Route>

    <Route path="/waiter" element={<WaiterRoute><WaiterLayout /></WaiterRoute>}>
      <Route index element={renderLazy(WaiterDashboardPage)} />
      <Route path="new-order" element={renderLazy(WaiterNewOrderPage)} />
      <Route path="active-orders" element={renderLazy(WaiterOrdersPage, { scope: "active" })} />
      <Route path="served-orders" element={renderLazy(WaiterOrdersPage, { scope: "history" })} />
      <Route path="tables" element={renderLazy(WaiterTablesPage)} />
      <Route path="settings" element={renderLazy(DashboardSettingsPage)} />
    </Route>

    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default AppRouter;
