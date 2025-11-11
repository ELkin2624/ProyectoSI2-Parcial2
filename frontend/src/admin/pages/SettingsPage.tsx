import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Lock, Mail, Phone, Loader2, Save, KeyRound } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useAuthStore } from '@/auth/store/auth.store';
import { updateProfileAction, changePasswordAction } from '@/auth/actions/update-profile.action';

export default function SettingsPage() {
    const { user, checkAuthStatus } = useAuthStore();
    const queryClient = useQueryClient();

    // Estados para el formulario de perfil
    const [firstName, setFirstName] = useState(user?.first_name || '');
    const [lastName, setLastName] = useState(user?.last_name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [phoneNumber, setPhoneNumber] = useState(user?.phone_number || '');

    // Estados para el formulario de contraseña
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Mutación para actualizar perfil
    const updateProfileMutation = useMutation({
        mutationFn: updateProfileAction,
        onSuccess: async () => {
            toast.success('Perfil actualizado exitosamente');
            await checkAuthStatus(); // Actualizar el estado global del usuario
            queryClient.invalidateQueries({ queryKey: ['user'] });
        },
        onError: (error: any) => {
            const errorMessage = error?.detail || 'Error al actualizar el perfil';
            toast.error(errorMessage);
        },
    });

    // Mutación para cambiar contraseña
    const changePasswordMutation = useMutation({
        mutationFn: ({ old_password, new_password }: { old_password: string; new_password: string }) =>
            changePasswordAction(old_password, new_password),
        onSuccess: () => {
            toast.success('Contraseña cambiada exitosamente');
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
        },
        onError: (error: any) => {
            const errorMessage = error?.detail || error?.old_password?.[0] || error?.new_password?.[0] || 'Error al cambiar la contraseña';
            toast.error(errorMessage);
        },
    });

    const handleUpdateProfile = (e: React.FormEvent) => {
        e.preventDefault();
        updateProfileMutation.mutate({
            first_name: firstName,
            last_name: lastName,
            email: email,
            phone_number: phoneNumber,
        });
    };

    const handleChangePassword = (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            toast.error('Las contraseñas no coinciden');
            return;
        }

        if (newPassword.length < 8) {
            toast.error('La contraseña debe tener al menos 8 caracteres');
            return;
        }

        changePasswordMutation.mutate({
            old_password: oldPassword,
            new_password: newPassword,
        });
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Configuración de Cuenta</h1>
                <p className="text-gray-600 mt-1">Administra tu información personal y seguridad</p>
            </div>

            <div className="space-y-6">
                {/* Información Personal */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Información Personal
                        </CardTitle>
                        <CardDescription>
                            Actualiza tu información básica de perfil
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleUpdateProfile} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName">Nombre</Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                        <Input
                                            id="firstName"
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                            className="pl-9"
                                            placeholder="Tu nombre"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="lastName">Apellido</Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                        <Input
                                            id="lastName"
                                            value={lastName}
                                            onChange={(e) => setLastName(e.target.value)}
                                            className="pl-9"
                                            placeholder="Tu apellido"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Correo Electrónico</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="pl-9"
                                        placeholder="tu@email.com"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phoneNumber">Teléfono</Label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="phoneNumber"
                                        type="tel"
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                        className="pl-9"
                                        placeholder="+591 12345678"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <Button
                                    type="submit"
                                    disabled={updateProfileMutation.isPending}
                                >
                                    {updateProfileMutation.isPending ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Guardando...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="mr-2 h-4 w-4" />
                                            Guardar Cambios
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Cambiar Contraseña */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Lock className="h-5 w-5" />
                            Seguridad
                        </CardTitle>
                        <CardDescription>
                            Cambia tu contraseña para mantener tu cuenta segura
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleChangePassword} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="oldPassword">Contraseña Actual</Label>
                                <div className="relative">
                                    <KeyRound className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="oldPassword"
                                        type="password"
                                        value={oldPassword}
                                        onChange={(e) => setOldPassword(e.target.value)}
                                        className="pl-9"
                                        placeholder="Tu contraseña actual"
                                        required
                                    />
                                </div>
                            </div>

                            <Separator />

                            <div className="space-y-2">
                                <Label htmlFor="newPassword">Nueva Contraseña</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="newPassword"
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="pl-9"
                                        placeholder="Nueva contraseña (min. 8 caracteres)"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="pl-9"
                                        placeholder="Confirma tu nueva contraseña"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <Button
                                    type="submit"
                                    disabled={changePasswordMutation.isPending}
                                    variant="outline"
                                >
                                    {changePasswordMutation.isPending ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Cambiando...
                                        </>
                                    ) : (
                                        <>
                                            <Lock className="mr-2 h-4 w-4" />
                                            Cambiar Contraseña
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
