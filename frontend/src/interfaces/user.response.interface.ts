// Interfaces para las respuestas de la API de usuarios

export interface Profile {
    id: number;
    user: number;
    avatar: string | null;
    avatar_url: string;
    sexo: 'M' | 'F' | 'O' | null;
    bio: string;
    dashboard_settings: any;
}

export interface Address {
    id: number;
    user: number;
    address_type: 'B' | 'S';
    street_address: string;
    apartment_address: string;
    city: string;
    state: string;
    country: string;
    postal_code: string;
    is_default: boolean;
    created_at: string;
    updated_at: string;
}

export interface Group {
    id: number;
    name: string;
}

export interface User {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    phone_number: string;
    profile: Profile;
    addresses: Address[];
    groups: Group[];
    is_admin: boolean;
    is_active: boolean;
    date_joined: string;
}

export interface UsersResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: User[];
}

export interface CreateUserData {
    email: string;
    first_name: string;
    last_name: string;
    phone_number?: string;
    password: string;
    is_staff?: boolean;
    is_active?: boolean;
    group_ids?: number[];
}

export interface UpdateUserData {
    first_name?: string;
    last_name?: string;
    phone_number?: string;
    is_staff?: boolean;
    is_active?: boolean;
    group_ids?: number[];
    password?: string;
}
