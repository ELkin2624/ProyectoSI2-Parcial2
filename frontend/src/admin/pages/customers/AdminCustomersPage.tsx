import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Search, Edit, Trash2, Eye, PlusIcon, Loader2 } from "lucide-react";
import { AdminTitle } from "@/admin/components/AdminTitle";
import { CustomerModal } from "@/admin/components/CustomerModal";
import { CustomerViewModal } from "@/admin/components/CustomerViewModal";
import { useUsers } from "@/admin/hooks/useUsers";
import { CustomPagination } from "@/components/custom/CustomPagination";
import type { User, CreateUserData, UpdateUserData } from "@/interfaces/user.response.interface";
import { useSearchParams } from "react-router";

export const AdminCustomersPage = () => {
    const [searchParams] = useSearchParams();
    const [searchTerm, setSearchTerm] = useState("");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    const {
        users,
        isLoading,
        createUser,
        updateUser,
        deleteUser,
        isCreating,
        isUpdating,
        isDeleting
    } = useUsers();



    // Obtener el page_size actual
    const pageSize = Number(searchParams.get('page_size')) || 10;

    // Calcular el total de páginas
    const totalPages = users?.count ? Math.ceil(users.count / pageSize) : 0;

    // Filtrar usuarios por búsqueda
    const filteredUsers = users?.results?.filter(user => {
        const searchLower = searchTerm.toLowerCase();
        return (
            user.first_name.toLowerCase().includes(searchLower) ||
            user.last_name.toLowerCase().includes(searchLower) ||
            user.email.toLowerCase().includes(searchLower) ||
            user.phone_number?.toLowerCase().includes(searchLower)
        );
    }) || [];



    const handleCreateUser = async (data: CreateUserData | UpdateUserData) => {
        await createUser(data as CreateUserData);
        setIsCreateModalOpen(false);
    };

    const handleEditUser = async (data: CreateUserData | UpdateUserData) => {
        if (selectedUser) {
            await updateUser({ userId: selectedUser.id, userData: data as UpdateUserData });
            setIsEditModalOpen(false);
            setSelectedUser(null);
        }
    };

    const handleDeleteUser = async () => {
        if (selectedUser) {
            await deleteUser(selectedUser.id);
            setIsDeleteDialogOpen(false);
            setSelectedUser(null);
        }
    };

    const openEditModal = (user: User) => {
        setSelectedUser(user);
        setIsEditModalOpen(true);
    };

    const openViewModal = (user: User) => {
        setSelectedUser(user);
        setIsViewModalOpen(true);
    };

    const openDeleteDialog = (user: User) => {
        setSelectedUser(user);
        setIsDeleteDialogOpen(true);
    };

    return (
        <>
            {/* Header */}
            <div className="flex items-center justify-between">
                <AdminTitle
                    title="Clientes"
                    subtitle="Aquí puedes ver y administrar tus clientes"
                />
                <div className="flex justify-end mb-10 gap-4">
                    <Button onClick={() => setIsCreateModalOpen(true)}>
                        <PlusIcon />
                        Nuevo Cliente
                    </Button>
                </div>
            </div>

            {/* Search and Filters */}
            <Card className="p-6 border-border shadow-tesla mb-6">
                <div className="flex gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por nombre, email o teléfono..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>
            </Card>

            {/* Loading State */}
            {isLoading && (
                <div className="flex justify-center items-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            )}

            {/* Table */}
            {!isLoading && (
                <>
                    <Card className="border-border shadow-tesla mb-6">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent border-border">
                                    <TableHead className="font-normal text-muted-foreground">ID</TableHead>
                                    <TableHead className="font-normal text-muted-foreground">Nombre</TableHead>
                                    <TableHead className="font-normal text-muted-foreground">Email</TableHead>
                                    <TableHead className="font-normal text-muted-foreground">Teléfono</TableHead>
                                    <TableHead className="font-normal text-muted-foreground">Rol</TableHead>
                                    <TableHead className="font-normal text-muted-foreground">Estado</TableHead>
                                    <TableHead className="font-normal text-muted-foreground text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredUsers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                            No se encontraron clientes
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredUsers.map((user) => (
                                        <TableRow key={user.id} className="border-border transition-smooth hover:bg-secondary/50">
                                            <TableCell className="font-normal">{user.id}</TableCell>
                                            <TableCell className="font-normal">
                                                {user.first_name} {user.last_name}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">{user.email}</TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {user.phone_number || 'N/A'}
                                            </TableCell>
                                            <TableCell>
                                                {user.is_admin ? (
                                                    <Badge variant="destructive">Admin</Badge>
                                                ) : (
                                                    <Badge variant="secondary">Cliente</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={user.is_active ? "default" : "secondary"}
                                                    className="font-normal"
                                                >
                                                    {user.is_active ? "Activo" : "Inactivo"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={() => openViewModal(user)}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={() => openEditModal(user)}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-destructive hover:text-destructive"
                                                        onClick={() => openDeleteDialog(user)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </Card>

                    {/* Pagination */}
                    <CustomPagination totalPages={totalPages} />
                </>
            )}

            {/* Modals */}
            <CustomerModal
                open={isCreateModalOpen}
                onOpenChange={setIsCreateModalOpen}
                onSubmit={handleCreateUser}
                isLoading={isCreating}
            />

            <CustomerModal
                open={isEditModalOpen}
                onOpenChange={setIsEditModalOpen}
                onSubmit={handleEditUser}
                user={selectedUser}
                isLoading={isUpdating}
            />

            <CustomerViewModal
                open={isViewModalOpen}
                onOpenChange={setIsViewModalOpen}
                user={selectedUser}
            />

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. Se eliminará permanentemente el usuario{' '}
                            <strong>
                                {selectedUser?.first_name} {selectedUser?.last_name}
                            </strong>{' '}
                            y todos sus datos asociados.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteUser}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
