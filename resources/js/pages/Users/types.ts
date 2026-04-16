export type UserRow = {
    id: number;
    name: string;
    email: string;
    is_active: boolean;
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
    is_active: string;
    password: string;
    password_confirmation: string;
    roles: string[];
};

export const initialUserForm: UserForm = {
    name: '',
    email: '',
    is_active: 'true',
    password: '',
    password_confirmation: '',
    roles: [],
};
