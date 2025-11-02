
import { AdminTitle } from '@/admin/components/AdminTitle';
import { Navigate, useParams } from 'react-router';

import { useState } from 'react';
import { X, Upload, SaveAll } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router';
import { useProduct } from '@/hooks/useProduct';
import { ProductForm } from './ui/ProductForm';

interface Product {
    id: string;
    title: string;
    price: number;
    description: string;
    slug: string;
    stock: number;
    sizes: string[];
    gender: string;
    tags: string[];
    images: string[];
}

export const AdminProductPage = () => {
    const { id } = useParams();

    const { data: product, isLoading, isError } = useProduct(id || '');

    console.log({ isLoading, product })

    const title = id === 'new' ? 'Nuevo producto' : 'Editar producto';
    const subtitle =
        id === 'new'
            ? 'Aquí puedes crear un nuevo producto.'
            : 'Aquí puedes editar el producto.';


    if (isError) {
        return <Navigate to={'/admin/products'} />
    }

    if (isLoading) {
        return <h1>Cargando</h1>
    }

    if (!product) {
        return <Navigate to={'/admin/products'} />
    }

    return <ProductForm
        title={title}
        subTitle={subtitle}
        product={product}
    />

};