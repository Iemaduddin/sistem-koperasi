export type UserRow = {
    id: number;
    name: string;
    email: string;
    roles: string[];
    is_super_admin: boolean;
    created_at: string | null;
};

export type SharedAuthUser = {
    id: number;
} | null;

export type UsersPageProps = {
    users: UserRow[];
    roles: string[];
    flash?: {
        success?: string;
        error?: string;
    };
};

export type UserForm = {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    roles: string[];
};

export const initialUserForm: UserForm = {
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    roles: [],
};
