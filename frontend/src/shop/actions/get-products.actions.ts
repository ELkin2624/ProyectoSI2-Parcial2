import { boutiqueApi } from "@/api/BoutiqueApi"



export const getProductsAction = async () => {

    const { } = await boutiqueApi.get('/products')

}
