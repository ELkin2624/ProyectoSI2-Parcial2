
export interface Productos {
    id: number;
    nombre: string;
    slug: string;
    descripcion: string;
    activo: boolean;
    creado_en: Date;
    actualizado_en: Date;
    categoria: Categoria;
    atributos: Atributo[];
    imagenes_galeria: any[];
    variantes: Variante[];
}

export interface Atributo {
    id: number;
    nombre: string;
}


export interface Categoria {
    id: number;
    nombre: string;
    slug: string;
    padre: number;
    descripcion: string;
    imagen_url: null;
    hijos: any[];
}

export interface Variante {
    id: number;
    sku: string;
    precio: string;
    precio_oferta: null | string;
    activo: boolean;
    stock_total: number;
    stock_records: StockRecord[];
    imagen_variante: null;
    imagen_variante_url: null;
    valores: Valore[];
}

export interface StockRecord {
    id: number;
    variante: string;
    almacen: Almacen;
    cantidad: number;
}

export interface Almacen {
    id: number;
    nombre: string;
    direccion: string;
    activo: boolean;
}


export interface Valore {
    id: number;
    atributo: Atributo;
    valor: string;
}
