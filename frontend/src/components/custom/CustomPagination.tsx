import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "../ui/button"
import { useSearchParams } from "react-router";

interface Props {
    totalPages: number;
}

export const CustomPagination = ({ totalPages }: Props) => {

    const [searchParams, setSearchParams] = useSearchParams();

    const queryPage = searchParams.get('page') ?? '1';
    const page = isNaN(+queryPage) ? 1 : +queryPage;

    const handlePageChange = (page: number) => {
        if (page < 1 || page > totalPages) return;

        searchParams.set('page', page.toString());

        setSearchParams(searchParams);
    }

    // Generar array de páginas a mostrar con lógica de puntos suspensivos
    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        const maxVisible = 7; // Máximo de botones visibles

        if (totalPages <= maxVisible) {
            // Si hay 7 páginas o menos, mostrar todas
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Siempre mostrar primera página
            pages.push(1);

            if (page <= 3) {
                // Si estamos en las primeras páginas
                for (let i = 2; i <= 4; i++) {
                    pages.push(i);
                }
                pages.push('...');
                pages.push(totalPages);
            } else if (page >= totalPages - 2) {
                // Si estamos en las últimas páginas
                pages.push('...');
                for (let i = totalPages - 3; i <= totalPages; i++) {
                    pages.push(i);
                }
            } else {
                // Si estamos en el medio
                pages.push('...');
                pages.push(page - 1);
                pages.push(page);
                pages.push(page + 1);
                pages.push('...');
                pages.push(totalPages);
            }
        }

        return pages;
    };

    return (
        <div className="flex items-center justify-center space-x-2">
            <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => handlePageChange(page - 1)}
            >
                <ChevronLeft className="h-4 w-4" />
                Anterior
            </Button>

            {getPageNumbers().map((pageNum, index) => {
                if (pageNum === '...') {
                    return (
                        <span key={`ellipsis-${index}`} className="px-2 text-gray-500">
                            ...
                        </span>
                    );
                }

                return (
                    <Button
                        key={pageNum}
                        variant={page === pageNum ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handlePageChange(pageNum as number)}
                    >
                        {pageNum}
                    </Button>
                );
            })}

            <Button
                variant="outline"
                size="sm"
                disabled={page === totalPages}
                onClick={() => handlePageChange(page + 1)}
            >
                Siguiente
                <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
    )
}
