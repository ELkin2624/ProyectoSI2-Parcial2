import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MapPin, Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import {
    getMyAddressesAction,
    createAddressAction,
    updateAddressAction,
    deleteAddressAction,
    type Address,
    type CreateAddressData
} from "../../actions/addresses.action";

type AddressFormData = CreateAddressData;

export const MyAddressesPage = () => {
    const queryClient = useQueryClient();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingAddress, setEditingAddress] = useState<Address | null>(null);
    const [formData, setFormData] = useState<AddressFormData>({
        address_type: 'SHIPPING',
        street_address: '',
        apartment_address: '',
        city: '',
        state: '',
        country: '',
        postal_code: '',
        is_default: false,
    });

    // Query para obtener direcciones
    const { data: addresses = [], isLoading, error, refetch } = useQuery<Address[]>({
        queryKey: ['addresses'],
        queryFn: getMyAddressesAction,
        retry: 2,
        staleTime: 1000 * 60 * 5, // 5 minutos
    });

    if (error) {
        console.error('❌ Error al cargar direcciones:', error);
    }

    // Mutation para crear dirección
    const createMutation = useMutation({
        mutationFn: createAddressAction,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['addresses'] });
            toast.success('Dirección creada exitosamente');
            setIsDialogOpen(false);
            resetForm();
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || 'Error al crear dirección');
        },
    });

    // Mutation para actualizar dirección
    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: AddressFormData }) =>
            updateAddressAction(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['addresses'] });
            toast.success('Dirección actualizada exitosamente');
            setIsDialogOpen(false);
            resetForm();
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || 'Error al actualizar dirección');
        },
    });

    // Mutation para eliminar dirección
    const deleteMutation = useMutation({
        mutationFn: deleteAddressAction,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['addresses'] });
            toast.success('Dirección eliminada exitosamente');
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || 'Error al eliminar dirección');
        },
    });

    const resetForm = () => {
        setFormData({
            address_type: 'SHIPPING',
            street_address: '',
            apartment_address: '',
            city: '',
            state: '',
            country: '',
            postal_code: '',
            is_default: false,
        });
        setEditingAddress(null);
    };

    const handleEdit = (address: Address) => {
        setEditingAddress(address);
        setFormData({
            address_type: address.address_type,
            street_address: address.street_address,
            apartment_address: address.apartment_address || '',
            city: address.city,
            state: address.state,
            country: address.country,
            postal_code: address.postal_code,
            is_default: address.is_default,
        });
        setIsDialogOpen(true);
    };

    const handleDelete = (addressId: number) => {
        if (confirm('¿Estás seguro de eliminar esta dirección?')) {
            deleteMutation.mutate(addressId);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (editingAddress) {
            updateMutation.mutate({ id: editingAddress.id, data: formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    const handleInputChange = (field: keyof AddressFormData, value: string | boolean) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-8 flex flex-col justify-center items-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">Cargando direcciones...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 py-8 flex flex-col justify-center items-center min-h-[400px]">
                <p className="text-red-600 mb-4">Error al cargar las direcciones</p>
                <Button onClick={() => refetch()}>Reintentar</Button>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-2">
                            <MapPin className="h-8 w-8" />
                            Mis Direcciones
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Gestiona tus direcciones de envío y facturación
                        </p>
                    </div>

                    <Dialog open={isDialogOpen} onOpenChange={(open) => {
                        setIsDialogOpen(open);
                        if (!open) resetForm();
                    }}>
                        <DialogTrigger asChild>
                            <Button className="gap-2">
                                <Plus className="h-4 w-4" />
                                Nueva Dirección
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>
                                    {editingAddress ? 'Editar Dirección' : 'Nueva Dirección'}
                                </DialogTitle>
                                <DialogDescription>
                                    {editingAddress
                                        ? 'Actualiza la información de tu dirección'
                                        : 'Completa el formulario para agregar una nueva dirección'}
                                </DialogDescription>
                            </DialogHeader>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Tipo de dirección */}
                                <div className="space-y-2">
                                    <Label>Tipo de Dirección</Label>
                                    <RadioGroup
                                        value={formData.address_type}
                                        onValueChange={(value) => handleInputChange('address_type', value)}
                                    >
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="SHIPPING" id="shipping" />
                                            <Label htmlFor="shipping" className="cursor-pointer">Envío</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="BILLING" id="billing" />
                                            <Label htmlFor="billing" className="cursor-pointer">Facturación</Label>
                                        </div>
                                    </RadioGroup>
                                </div>

                                {/* Dirección */}
                                <div className="space-y-2">
                                    <Label htmlFor="street_address">Dirección *</Label>
                                    <Input
                                        id="street_address"
                                        value={formData.street_address}
                                        onChange={(e) => handleInputChange('street_address', e.target.value)}
                                        placeholder="Calle, número"
                                        required
                                    />
                                </div>

                                {/* Apartamento/Depto */}
                                <div className="space-y-2">
                                    <Label htmlFor="apartment_address">Apartamento/Depto (opcional)</Label>
                                    <Input
                                        id="apartment_address"
                                        value={formData.apartment_address}
                                        onChange={(e) => handleInputChange('apartment_address', e.target.value)}
                                        placeholder="Ej: Apto 4B, Piso 2"
                                    />
                                </div>

                                {/* Ciudad y Estado */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="city">Ciudad *</Label>
                                        <Input
                                            id="city"
                                            value={formData.city}
                                            onChange={(e) => handleInputChange('city', e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="state">Estado/Provincia *</Label>
                                        <Input
                                            id="state"
                                            value={formData.state}
                                            onChange={(e) => handleInputChange('state', e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                {/* País y Código Postal */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="country">País *</Label>
                                        <Input
                                            id="country"
                                            value={formData.country}
                                            onChange={(e) => handleInputChange('country', e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="postal_code">Código Postal *</Label>
                                        <Input
                                            id="postal_code"
                                            value={formData.postal_code}
                                            onChange={(e) => handleInputChange('postal_code', e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Dirección por defecto */}
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id="is_default"
                                        checked={formData.is_default}
                                        onChange={(e) => handleInputChange('is_default', e.target.checked)}
                                        className="h-4 w-4 rounded border-gray-300"
                                    />
                                    <Label htmlFor="is_default" className="cursor-pointer">
                                        Establecer como dirección predeterminada
                                    </Label>
                                </div>

                                {/* Botones */}
                                <div className="flex justify-end gap-2 pt-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsDialogOpen(false)}
                                    >
                                        Cancelar
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={createMutation.isPending || updateMutation.isPending}
                                    >
                                        {(createMutation.isPending || updateMutation.isPending) && (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        )}
                                        {editingAddress ? 'Actualizar' : 'Crear'}
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>


                {/* Lista de direcciones */}
                {!Array.isArray(addresses) || addresses.length === 0 ? (
                    <Card>
                        console.log(Array.isArray(addresses));
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <MapPin className="h-16 w-16 text-muted-foreground mb-4" />
                            <p className="text-lg font-medium mb-2">No tienes direcciones registradas</p>
                            <p className="text-muted-foreground text-center mb-4">
                                Agrega tu primera dirección para facilitar tus compras
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                        {addresses.map((address) => (
                            <Card key={address.id} className={address.is_default ? 'border-primary' : ''}>
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="flex items-center gap-2">
                                                {address.address_type === 'SHIPPING' ? 'Envío' : 'Facturación'}
                                                {address.is_default && (
                                                    <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                                                        Predeterminada
                                                    </span>
                                                )}
                                            </CardTitle>
                                        </div>
                                        <div className="flex gap-1">
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => handleEdit(address)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => handleDelete(address.id)}
                                                disabled={deleteMutation.isPending}
                                            >
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-1 text-sm">
                                        <p className="font-medium">{address.street_address}</p>
                                        {address.apartment_address && (
                                            <p className="text-muted-foreground">{address.apartment_address}</p>
                                        )}
                                        <p>{address.city}, {address.state}</p>
                                        <p>{address.country} - {address.postal_code}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
