import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlmacenesSection } from "@/admin/components/inventory/AlmacenesSection";
import { StockSection } from "@/admin/components/inventory/StockSection";
import { Package, Warehouse } from "lucide-react";

export const InventoryPage = () => {
    const [activeTab, setActiveTab] = useState("almacenes");

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Gestión de Inventario</h1>
                <p className="text-gray-600 mt-2">
                    Administra los almacenes y el stock de productos
                </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="almacenes" className="flex items-center gap-2">
                        <Warehouse className="h-4 w-4" />
                        Almacenes
                    </TabsTrigger>
                    <TabsTrigger value="stock" className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Stock
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="almacenes" className="mt-6">
                    <AlmacenesSection />
                </TabsContent>

                <TabsContent value="stock" className="mt-6">
                    <StockSection />
                </TabsContent>
            </Tabs>
        </div>
    );
};
