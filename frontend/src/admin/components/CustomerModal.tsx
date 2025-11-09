import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { User, CreateUserData, UpdateUserData } from "@/interfaces/user.response.interface";
import { Loader2 } from "lucide-react";

interface CustomerModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: CreateUserData | UpdateUserData) => Promise<void>;
    user?: User | null;
    isLoading?: boolean;
}

export const CustomerModal = ({
    open,
    onOpenChange,
    onSubmit,
    user,
    isLoading = false
}: CustomerModalProps) => {
    const isEditMode = !!user;

    const [formData, setFormData] = useState({
        email: "",
        first_name: "",
        last_name: "",
        phone_number: "",
        password: "",
        confirmPassword: "",
        is_staff: false,
        is_active: true,
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (user) {
            setFormData({
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                phone_number: user.phone_number || "",
                password: "",
                confirmPassword: "",
                is_staff: user.groups.some(g => g.name === 'admin') || false,
                is_active: user.is_active,
            });
        } else {
            setFormData({
                email: "",
                first_name: "",
                last_name: "",
                phone_number: "",
                password: "",
                confirmPassword: "",
                is_staff: false,
                is_active: true,
            });
        }
        setErrors({});
    }, [user, open]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Limpiar error del campo
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: "" }));
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!isEditMode) {
            if (!formData.email.trim()) {
                newErrors.email = "El email es requerido";
            } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
                newErrors.email = "El email no es válido";
            }

            if (!formData.password) {
                newErrors.password = "La contraseña es requerida";
            } else if (formData.password.length < 8) {
                newErrors.password = "La contraseña debe tener al menos 8 caracteres";
            }

            if (formData.password !== formData.confirmPassword) {
                newErrors.confirmPassword = "Las contraseñas no coinciden";
            }
        }

        if (!formData.first_name.trim()) {
            newErrors.first_name = "El nombre es requerido";
        }

        if (!formData.last_name.trim()) {
            newErrors.last_name = "El apellido es requerido";
        }

        // En modo edición, validar contraseña solo si se ingresó
        if (isEditMode && formData.password) {
            if (formData.password.length < 8) {
                newErrors.password = "La contraseña debe tener al menos 8 caracteres";
            }
            if (formData.password !== formData.confirmPassword) {
                newErrors.confirmPassword = "Las contraseñas no coinciden";
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            if (isEditMode) {
                const updateData: UpdateUserData = {
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                    phone_number: formData.phone_number || undefined,
                    is_staff: formData.is_staff,
                    is_active: formData.is_active,
                };

                // Solo incluir contraseña si se proporcionó
                if (formData.password) {
                    updateData.password = formData.password;
                }

                await onSubmit(updateData);
            } else {
                const createData: CreateUserData = {
                    email: formData.email,
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                    phone_number: formData.phone_number || undefined,
                    password: formData.password,
                    is_staff: formData.is_staff,
                    is_active: formData.is_active,
                };

                await onSubmit(createData);
            }

            onOpenChange(false);
        } catch (error) {
            console.error('Error al guardar usuario:', error);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>
                        {isEditMode ? "Editar Usuario" : "Nuevo Usuario"}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditMode
                            ? "Modifica la información del usuario."
                            : "Completa el formulario para crear un nuevo usuario."}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        {/* Email - Solo en modo creación */}
                        {!isEditMode && (
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email *</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="usuario@ejemplo.com"
                                />
                                {errors.email && (
                                    <p className="text-sm text-red-500">{errors.email}</p>
                                )}
                            </div>
                        )}

                        {/* Nombre */}
                        <div className="grid gap-2">
                            <Label htmlFor="first_name">Nombre *</Label>
                            <Input
                                id="first_name"
                                name="first_name"
                                value={formData.first_name}
                                onChange={handleChange}
                                placeholder="Juan"
                            />
                            {errors.first_name && (
                                <p className="text-sm text-red-500">{errors.first_name}</p>
                            )}
                        </div>

                        {/* Apellido */}
                        <div className="grid gap-2">
                            <Label htmlFor="last_name">Apellido *</Label>
                            <Input
                                id="last_name"
                                name="last_name"
                                value={formData.last_name}
                                onChange={handleChange}
                                placeholder="Pérez"
                            />
                            {errors.last_name && (
                                <p className="text-sm text-red-500">{errors.last_name}</p>
                            )}
                        </div>

                        {/* Teléfono */}
                        <div className="grid gap-2">
                            <Label htmlFor="phone_number">Teléfono</Label>
                            <Input
                                id="phone_number"
                                name="phone_number"
                                value={formData.phone_number}
                                onChange={handleChange}
                                placeholder="+52 55 1234 5678"
                            />
                        </div>

                        {/* Contraseña */}
                        <div className="grid gap-2">
                            <Label htmlFor="password">
                                Contraseña {!isEditMode && "*"}
                                {isEditMode && " (dejar vacío para no cambiar)"}
                            </Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="********"
                            />
                            {errors.password && (
                                <p className="text-sm text-red-500">{errors.password}</p>
                            )}
                        </div>

                        {/* Confirmar Contraseña */}
                        <div className="grid gap-2">
                            <Label htmlFor="confirmPassword">
                                Confirmar Contraseña {!isEditMode && "*"}
                            </Label>
                            <Input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                placeholder="********"
                            />
                            {errors.confirmPassword && (
                                <p className="text-sm text-red-500">{errors.confirmPassword}</p>
                            )}
                        </div>

                        {/* Checkboxes */}
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="is_staff"
                                    checked={formData.is_staff}
                                    onCheckedChange={(checked) =>
                                        setFormData(prev => ({ ...prev, is_staff: checked as boolean }))
                                    }
                                />
                                <Label
                                    htmlFor="is_staff"
                                    className="text-sm font-normal cursor-pointer"
                                >
                                    Usuario administrador
                                </Label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="is_active"
                                    checked={formData.is_active}
                                    onCheckedChange={(checked) =>
                                        setFormData(prev => ({ ...prev, is_active: checked as boolean }))
                                    }
                                />
                                <Label
                                    htmlFor="is_active"
                                    className="text-sm font-normal cursor-pointer"
                                >
                                    Usuario activo
                                </Label>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isLoading}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isEditMode ? "Guardar Cambios" : "Crear Usuario"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
