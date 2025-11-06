import { lazy } from "react";
import { createBrowserRouter, Navigate } from "react-router";


import { RegisterPage } from "./auth/page/register/RegisterPage";
import { LoginPage } from "./auth/page/login/LoginPage";
import { ShopLayout } from "./shop/layouts/ShopLayout";
import { HomePage, ProductPage, GenderPage, CartPage } from "./shop/pages";
import { AdminCustomersPage, AdminProductPage, AdminProductsPage, AdminSalesHistoryPage, AdminSalesPage, DashboardPage } from "./admin/pages";
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
                path: 'products/:id',
                element: <AdminProductPage />
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
            }
        ]
    },
    {
        path: '*',
        element: <Navigate to='/' />
    }
])