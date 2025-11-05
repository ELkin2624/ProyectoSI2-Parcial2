import { boutiqueApi } from "@/api/BoutiqueApi"
import type { AuthResponse } from "../interfaces/auth.response";



export const loginAction = async (email: string, password: string): Promise<AuthResponse> => {
    try {

        const { data } = await boutiqueApi.post<AuthResponse>('/auth/login', {
            email,
            password
        })

        // console.log(data);

        return data;

    } catch (error) {
        // console.log(error);
        throw error;
    }
}