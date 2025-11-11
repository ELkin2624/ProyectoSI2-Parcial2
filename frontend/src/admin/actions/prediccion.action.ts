// src/admin/actions/prediccion.action.ts
import { boutiqueApi } from '@/api/BoutiqueApi';
import { AxiosError } from 'axios';

export interface PrediccionRequest {
    dias_a_predecir: number;
}

export interface PrediccionResponse {
    dias_solicitados: number;
    predicciones: Array<{
        fecha: string;
        prediccion_venta: number;
    }>;
}

/**
 * Realiza predicción de ventas usando el microservicio de ML
 */
export const predecirVentas = async (
    request: PrediccionRequest
): Promise<PrediccionResponse> => {
    try {
        const response = await boutiqueApi.post<PrediccionResponse>(
            'ia/prediccion/',
            request
        );

        return response.data;

    } catch (error) {
        const axiosError = error as AxiosError<any>;

        if (axiosError.response?.status === 503) {
            throw new Error('El servicio de predicción no está disponible. Por favor, verifica que el microservicio esté activo.');
        }

        if (axiosError.response?.data?.error) {
            throw new Error(axiosError.response.data.error);
        }

        throw new Error('Error al realizar la predicción de ventas');
    }
};
