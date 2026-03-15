export const DASHBOARD_ROLE_META = {
  admin: {
    label: "Admin",
    shortLabel: "Admin",
    home: "/admin",
    loginPath: "/admin/login",
    themeTitle: "Administrator",
    navItems: [
      { to: "/admin", label: "Dashboard", icon: "fa-chart-line" },
      { to: "/admin/users", label: "User Management", icon: "fa-users" },
      { to: "/admin/homepage", label: "Homepage Management", icon: "fa-house" },
      { to: "/admin/auth-branding", label: "Authentication Branding", icon: "fa-image" },
      { to: "/admin/categories", label: "Categories", icon: "fa-layer-group" },
      { to: "/admin/products", label: "Foods", icon: "fa-burger" },
      { to: "/admin/hero-slides", label: "Offers / Discounts", icon: "fa-tags" },
      { to: "/admin/orders", label: "Orders", icon: "fa-box" },
      { to: "/admin/delivery-management", label: "Delivery Management", icon: "fa-truck-fast" },
      { to: "/admin/staff?role=chef", label: "Chef Management", icon: "fa-kitchen-set" },
      { to: "/admin/staff?role=waiter", label: "Waiter Management", icon: "fa-bell-concierge" },
      { to: "/admin/accounting-overview", label: "Accounting Overview", icon: "fa-wallet" },
      { to: "/admin/reports", label: "Reports", icon: "fa-chart-pie" },
      { to: "/admin/settings", label: "Settings", icon: "fa-gear" },
    ],
    settingsPath: "/admin/settings",
  },
  hr: {
    label: "HR",
    shortLabel: "HR",
    home: "/hr",
    loginPath: "/login",
    themeTitle: "Human Resources",
    navItems: [
      { to: "/hr", label: "Dashboard", icon: "fa-people-group" },
      { to: "/hr/staff", label: "Staff Management", icon: "fa-user-gear" },
      { to: "/hr/roles", label: "Roles / Assignments", icon: "fa-user-tag" },
      { to: "/hr/attendance", label: "Attendance / Shifts", icon: "fa-calendar-check" },
      { to: "/hr/notes", label: "Staff Notes", icon: "fa-notes-medical" },
      { to: "/hr/settings", label: "Profile Settings", icon: "fa-id-badge" },
    ],
    settingsPath: "/hr/settings",
  },
  finance: {
    label: "Accounting",
    shortLabel: "Accounting",
    home: "/finance",
    loginPath: "/login",
    themeTitle: "Accounting",
    navItems: [
      { to: "/finance", label: "Dashboard", icon: "fa-chart-pie" },
      { to: "/finance/payments", label: "Payments", icon: "fa-credit-card" },
      { to: "/finance/revenue", label: "Revenue", icon: "fa-sack-dollar" },
      { to: "/finance/expenses", label: "Expenses", icon: "fa-file-invoice-dollar" },
      { to: "/finance/reports", label: "Financial Reports", icon: "fa-chart-column" },
      { to: "/finance/discounts", label: "Discounts Impact", icon: "fa-percent" },
      { to: "/finance/settings", label: "Profile Settings", icon: "fa-id-badge" },
    ],
    settingsPath: "/finance/settings",
  },
  delivery: {
    label: "Delivery Man",
    shortLabel: "Delivery",
    home: "/delivery",
    loginPath: "/login",
    themeTitle: "Delivery Man",
    navItems: [
      { to: "/delivery", label: "Dashboard", icon: "fa-truck-fast" },
      { to: "/delivery/assigned", label: "Assigned Deliveries", icon: "fa-box-open" },
      { to: "/delivery/history", label: "Delivery History", icon: "fa-clock-rotate-left" },
      { to: "/delivery/settings", label: "Profile Settings", icon: "fa-id-badge" },
    ],
    settingsPath: "/delivery/settings",
  },
  chef: {
    label: "Chef",
    shortLabel: "Chef",
    home: "/chef",
    loginPath: "/login",
    themeTitle: "Kitchen",
    navItems: [
      { to: "/chef", label: "Dashboard", icon: "fa-kitchen-set" },
      { to: "/chef/queue", label: "Order Queue", icon: "fa-list-check" },
      { to: "/chef/preparing", label: "Preparing Orders", icon: "fa-fire-burner" },
      { to: "/chef/completed", label: "Completed Orders", icon: "fa-circle-check" },
      { to: "/chef/notes", label: "Kitchen Notes", icon: "fa-note-sticky" },
      { to: "/chef/settings", label: "Profile Settings", icon: "fa-id-badge" },
    ],
    settingsPath: "/chef/settings",
  },
  waiter: {
    label: "Waiter",
    shortLabel: "Waiter",
    home: "/waiter",
    loginPath: "/login",
    themeTitle: "Waiter",
    navItems: [
      { to: "/waiter", label: "Dashboard", icon: "fa-bell-concierge" },
      { to: "/waiter/new-order", label: "New Order", icon: "fa-plus" },
      { to: "/waiter/active-orders", label: "Active Orders", icon: "fa-utensils" },
      { to: "/waiter/served-orders", label: "Served Orders", icon: "fa-clipboard-check" },
      { to: "/waiter/tables", label: "Tables", icon: "fa-table-cells-large" },
      { to: "/waiter/settings", label: "Profile Settings", icon: "fa-id-badge" },
    ],
    settingsPath: "/waiter/settings",
  },
  dispatcher: {
    label: "Dispatcher",
    shortLabel: "Dispatch",
    home: "/dispatcher",
    loginPath: "/login",
    themeTitle: "Dispatcher",
    navItems: [
      { to: "/dispatcher", label: "Dashboard", icon: "fa-truck-fast" },
      { to: "/dispatcher/delivery-staff", label: "Delivery Staff", icon: "fa-motorcycle" },
    ],
    settingsPath: "/dispatcher",
  },
};

export const getDashboardRoleMeta = (role) => DASHBOARD_ROLE_META[role] || null;

export const getDashboardHome = (role) => DASHBOARD_ROLE_META[role]?.home || "/";

export const getDashboardLoginPath = (roles = []) => (roles.includes("admin") ? "/admin/login" : "/login");

export const isAllowedDashboardRole = (role, allowedRoles = []) => allowedRoles.includes(role);

export const getDashboardRoleLabel = (role) => DASHBOARD_ROLE_META[role]?.label || role || "User";
