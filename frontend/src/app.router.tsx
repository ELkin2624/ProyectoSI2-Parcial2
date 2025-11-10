import { lazy } from "react";
import { createBrowserRouter, Navigate } from "react-router";


import { RegisterPage } from "./auth/page/register/RegisterPage";
import { LoginPage } from "./auth/page/login/LoginPage";
import { ShopLayout } from "./shop/layouts/ShopLayout";
import { HomePage, ProductPage, GenderPage, CartPage } from "./shop/pages";
import { MyPaymentsPage } from "./shop/pages/MyPaymentsPage";
import { CheckoutPage } from "./shop/pages/checkout/CheckoutPage";
import { MyAddressesPage } from "./shop/pages/addresses/MyAddressesPage";
import { PaymentPage } from "./shop/pages/payment/PaymentPage";
import { AdminCustomersPage, AdminProductPage, AdminProductsPage, AdminReportsPage, AdminSalesHistoryPage, AdminSalesPage, DashboardPage } from "./admin/pages";
import { InventoryPage } from "./admin/pages/InventoryPage";
import OrdersPage from "./admin/pages/OrdersPage";
import AdminPaymentsPage from "./admin/pages/AdminPaymentsPage";
import { NotAuthenticatedRoute, AdminRoute } from "./components/routes/ProtectedRoutes";


const AuthLayouts = lazy(() => import("./auth/layouts/AuthLayouts"));
const AdminLayout = lazy(() => import('./admin/layouts/AdminLayout'))

export const appRouter = createBrowserRouter([
    //Public routes
    {
        path: '/',
        element: <ShopLayout />,
        children: [
            {
                index: true,
                element: <HomePage />
            },
            {
                path: 'product/:idSlug',
                element: <ProductPage />
            },
            {
                path: 'gender/:gender',
                element: <GenderPage />
            },
            {
                path: 'cart',
                element: <CartPage />
            },
            {
                path: 'checkout',
                element: <CheckoutPage />
            },
            {
                path: 'my-addresses',
                element: <MyAddressesPage />
            },
            {
                path: 'pedido/:pedidoId/pago',
                element: <PaymentPage />
            },
            {
                path: 'my-payments',
                element: <MyPaymentsPage />
            }
        ]
    },
    // Auth routes  
    {
        path: '/auth',
        element: (
            <NotAuthenticatedRoute>
                <AuthLayouts />
            </NotAuthenticatedRoute>
        ),
        children: [
            {
                index: true,
                element: <Navigate to='/auth/login' />
            },
            {
                path: 'login',
                element: <LoginPage />
            },
            {
                path: 'register',
                element: <RegisterPage />
            }
        ]
    },
    // Admin route
    {
        path: '/admin',
        element: (
            <AdminRoute>
                <AdminLayout />
            </AdminRoute>
        ),
        children: [
            {
                index: true,
                element: <DashboardPage />
            },
            {
                path: 'products',
                element: <AdminProductsPage />
            },
            {
                path: 'products/:slug',
                element: <AdminProductPage />
            },
            {
                path: 'inventory',
                element: <InventoryPage />
            },
            {
                path: 'orders',
                element: <OrdersPage />
            },
            {
                path: 'payments',
                element: <AdminPaymentsPage />
            },
            {
                path: 'users',
                element: <AdminCustomersPage />
            },
            {
                path: 'sales',
                element: <AdminSalesPage />
            },
            {
                path: 'sales-history',
                element: <AdminSalesHistoryPage />
            },
            {
                path: 'reports',
                element: <AdminReportsPage />
            }
        ]
    },
    {
        path: '*',
        element: <Navigate to='/' />
    }
])