import { createBrowserRouter, Navigate } from "react-router";

import { ShopLayout } from "./shop/layouts/ShopLayout";
import { HomePage } from "./shop/pages/home/HomePage";
import { ProductPage } from "./shop/pages/product/ProductPage";
import { GenderPage } from "./shop/pages/gender/GenderPage";

import { LoginPage } from "./auth/page/login/LoginPage";
import { RegisterPage } from "./auth/page/register/RegisterPage";
import { DashboardPage } from "./admin/pages/dashboard/DashboardPage";
import { AdminProductsPage } from "./admin/pages/products/AdminProductsPage";
import { AdminProductPage } from "./admin/pages/product/AdminProductPage";
import { lazy } from "react";
import { CartPage } from "./shop/pages/cart/CartPage";

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
        element: <AuthLayouts />,
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
        element: <AdminLayout />,
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
            }
        ]
    },
    {
        path: '*',
        element: <Navigate to='/' />
    }
])