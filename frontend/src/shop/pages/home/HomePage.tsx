import { CustomPagination } from "@/components/custom/CustomPagination";
import { CustomJumbotron } from "@/shop/components/CustomJumbotron"
import { ProductsGrid } from "@/shop/components/ProductsGrid"
import { useProducts } from "@/shop/hooks/useProducts"
import { useSearchParams } from "react-router";

export const HomePage = () => {

    const { data } = useProducts() || {};
    const [searchParams] = useSearchParams();

    // Obtener el page_size actual (por defecto 12 según el backend)
    const pageSize = Number(searchParams.get('page_size')) || 12;

    // Calcular el total de páginas: count / page_size redondeado hacia arriba
    const totalPages = data?.count ? Math.ceil(data.count / pageSize) : 0;

    return (
        <>
            <CustomJumbotron title="Todos los productos" />
            <ProductsGrid products={data?.results || []} />
            <CustomPagination totalPages={totalPages} />
        </>
    )
}
