import { CustomPagination } from "@/components/custom/CustomPagination"
import { CustomJumbotron } from "@/shop/components/CustomJumbotron"
import { ProductsGrid } from "@/shop/components/ProductsGrid"
import { useProducts } from "@/shop/hooks/useProducts"
import { useParams, useSearchParams } from "react-router"

export const GenderPage = () => {

    const { gender } = useParams();
    const { data } = useProducts();
    const [searchParams] = useSearchParams();

    const genderLabel = gender === 'men' ? 'Hombres' : gender === 'women' ? 'Mujeres' : 'Niños'

    // Obtener el page_size actual (por defecto 12 según el backend)
    const pageSize = Number(searchParams.get('page_size')) || 12;

    // Calcular el total de páginas: count / page_size redondeado hacia arriba
    const totalPages = data?.count ? Math.ceil(data.count / pageSize) : 0;

    return (
        <>
            <CustomJumbotron title={`Productos para ${genderLabel}`} />
            <ProductsGrid products={data?.results || []} />
            <CustomPagination totalPages={totalPages} />
        </>
    )
}
