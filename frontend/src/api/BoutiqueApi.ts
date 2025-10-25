import axios from 'axios'



const boutiqueApi = axios.create({
    baseURL: import.meta.env.VITE_API_URL
})


// TODO: interceptores


export { boutiqueApi }