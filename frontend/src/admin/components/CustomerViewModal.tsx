import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { User } from "@/interfaces/user.response.interface";
import { Mail, Phone, Calendar, Shield, MapPin } from "lucide-react";

interface CustomerViewModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user: User | null;
}

export const CustomerViewModal = ({
    open,
    onOpenChange,
    user
}: CustomerViewModalProps) => {
    if (!user) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Información del Usuario</DialogTitle>
                    <DialogDescription>
                        Detalles completos del perfil del usuario
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Información Principal */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold">
                                    {user.first_name} {user.last_name}
                                </h3>
                                <p className="text-sm text-muted-foreground">ID: {user.id}</p>
                            </div>
                            <div className="flex gap-2">
                                <Badge variant={user.is_active ? "default" : "secondary"}>
                                    {user.is_active ? "Activo" : "Inactivo"}
                                </Badge>
                                {user.is_admin && (
                                    <Badge variant="destructive">
                                        <Shield className="h-3 w-3 mr-1" />
                                        Admin
                                    </Badge>
                                )}
                            </div>
                        </div>

                        <Separator />

                        {/* Contacto */}
                        <div className="space-y-3">
                            <h4 className="text-sm font-semibold text-muted-foreground">Contacto</h4>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    <span>{user.email}</span>
                                </div>
                                {user.phone_number && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                        <span>{user.phone_number}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <Separator />

                        {/* Perfil */}
                        {user.profile && (
                            <>
                                <div className="space-y-3">
                                    <h4 className="text-sm font-semibold text-muted-foreground">Perfil</h4>
                                    <div className="space-y-2">
                                        {user.profile.avatar_url && (
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={user.profile.avatar_url}
                                                    alt="Avatar"
                                                    className="h-16 w-16 rounded-full object-cover"
                                                />
                                            </div>
                                        )}
                                        {user.profile.sexo && (
                                            <div className="text-sm">
                                                <span className="font-medium">Sexo: </span>
                                                <span>
                                                    {user.profile.sexo === 'M' ? 'Masculino' :
                                                        user.profile.sexo === 'F' ? 'Femenino' : 'Otro'}
                                                </span>
                                            </div>
                                        )}
                                        {user.profile.bio && (
                                            <div className="text-sm">
                                                <span className="font-medium">Biografía: </span>
                                                <p className="text-muted-foreground mt-1">{user.profile.bio}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <Separator />
                            </>
                        )}

                        {/* Direcciones */}
                        {user.addresses && user.addresses.length > 0 && (
                            <>
                                <div className="space-y-3">
                                    <h4 className="text-sm font-semibold text-muted-foreground">
                                        Direcciones ({user.addresses.length})
                                    </h4>
                                    <div className="space-y-3">
                                        {user.addresses.map((address) => (
                                            <div
                                                key={address.id}
                                                className="p-3 border rounded-lg space-y-1 bg-muted/30"
                                            >
                                                <div className="flex items-start gap-2">
                                                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                                    <div className="flex-1 text-sm">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium">
                                                                {address.address_type === 'B' ? 'Facturación' : 'Envío'}
                                                            </span>
                                                            {address.is_default && (
                                                                <Badge variant="outline" className="text-xs">
                                                                    Predeterminada
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <p className="text-muted-foreground">
                                                            {address.street_address}
                                                            {address.apartment_address && `, ${address.apartment_address}`}
                                                        </p>
                                                        <p className="text-muted-foreground">
                                                            {address.city}, {address.state}
                                                        </p>
                                                        <p className="text-muted-foreground">
                                                            {address.country} - {address.postal_code}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <Separator />
                            </>
                        )}

                        {/* Grupos */}
                        {user.groups && user.groups.length > 0 && (
                            <>
                                <div className="space-y-3">
                                    <h4 className="text-sm font-semibold text-muted-foreground">Grupos</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {user.groups.map((group) => (
                                            <Badge key={group.id} variant="outline">
                                                {group.name}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                                <Separator />
                            </>
                        )}

                        {/* Fecha de Registro */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                <span>
                                    Registrado el {new Date(user.date_joined).toLocaleDateString('es-ES', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
