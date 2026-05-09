export type RoleRow = {
    uuid: string;
    name: string;
    permissions: string[];
    is_system_role: boolean;
};

export type RoleForm = {
    name: string;
    permissions: string[];
};

export type RolesPageProps = {
    roles: RoleRow[];
    permissions: string[];
};

export const initialRoleForm: RoleForm = {
    name: '',
    permissions: [],
};
