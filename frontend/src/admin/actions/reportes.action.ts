// src/admin/actions/reportes.action.ts
import { boutiqueApi } from '@/api/BoutiqueApi';
import { AxiosError } from 'axios';

export interface GenerarReporteRequest {
    prompt: string;
}

export interface GenerarReporteResponse {
    data: any;
    count?: number;
    mensaje?: string;
}

/**
 * Genera un reporte usando IA a través del microservicio de reportes
 * Puede devolver un archivo Excel para descarga o datos JSON
 */
export const generarReporteIA = async (
    request: GenerarReporteRequest
): Promise<{ data: any; isFile: boolean; fileName?: string }> => {
    try {
        const response = await boutiqueApi.post('ia/reporte/', request, {
            responseType: 'blob', // Importante para manejar archivos
        });

        // Verificar si es un archivo Excel
        const contentType = response.headers['content-type'];
        const contentDisposition = response.headers['content-disposition'];

        if (contentType?.includes('spreadsheet') || contentType?.includes('excel')) {
            // Es un archivo Excel
            let fileName = 'reporte.xlsx';

            // Intentar extraer el nombre del archivo del header Content-Disposition
            if (contentDisposition) {
                const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
                if (matches != null && matches[1]) {
                    fileName = matches[1].replace(/['"]/g, '');
                }
            }

            return {
                data: response.data,
                isFile: true,
                fileName
            };
        } else {
            // Es JSON, necesitamos convertir el blob a JSON
            const text = await response.data.text();
            const jsonData = JSON.parse(text);

            return {
                data: jsonData,
                isFile: false
            };
        }

    } catch (error) {
        const axiosError = error as AxiosError<any>;

        if (axiosError.response?.status === 503) {
            throw new Error('El servicio de reportes no está disponible. Por favor, verifica que el microservicio esté activo.');
        }

        if (axiosError.response?.data) {
            // Si es un blob, intentar convertirlo a texto
            if (axiosError.response.data instanceof Blob) {
                const text = await axiosError.response.data.text();
                try {
                    const errorData = JSON.parse(text);
                    throw new Error(errorData.error || 'Error al generar el reporte');
                } catch {
                    throw new Error(text || 'Error al generar el reporte');
                }
            }

            throw new Error(axiosError.response.data.error || 'Error al generar el reporte');
        }

        throw new Error('Error de conexión al servidor');
    }
};

/**
 * Descarga un blob como archivo
 */
export const descargarArchivo = (blob: Blob, fileName: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
};
