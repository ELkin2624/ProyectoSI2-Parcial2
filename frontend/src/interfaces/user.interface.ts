export interface Group {
   id: number;
   name: string;
}
export interface User {
   id: string;
   email: string;
   first_name: string;
   last_name: string;
   phone_number: string;
   groups: Group[];
   is_admin: boolean;
}