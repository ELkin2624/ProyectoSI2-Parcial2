import type { User } from "@/interfaces/user.interface";

export interface AuthResponse {
    user: User;
    token: string;
}

