import { boutiqueApi } from "@/api/BoutiqueApi"
import type { AuthResponse } from "../interfaces/auth.response";



export const registerAction = async (email: string, password: string, fullName: string): Promise<AuthResponse> => {
    try {

        console.log({ email, password, fullName })

        const { data } = await boutiqueApi.post<AuthResponse>('/auth/register', {
            email,
            password,
            fullName
        })
        console.log({ email, password, fullName })


        return data;

    } catch (error: any) {
        console.error('Error details: ', error.response.data);
        throw error;
    }
}