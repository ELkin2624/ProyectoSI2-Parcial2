import type { Productos } from "@/interfaces/productos.interface";

interface resultTallas {
    id: number;
    valor: string;
}

interface resultColores {
    id: number;
    valor: string;
    hex: string;
}

export const colorHexMap: { [key: string]: string } = {
    "Negro": "#000000",
    "Blanco": "#FFFFFF",
    "Gris": "#9CA3AF",
    "Beige": "#D4C5B9",
    "Azul Marino": "#000080",
    "Gris Oscuro": "#828282",
    // Agrega aquí todos los demás colores que uses en tu aplicación
};

export const obtenerColores = (producto: Productos): resultColores[] => {
    const variantes = producto.variantes;
    const coloresDisponibles = new Map(); // Usamos Map para manejar la unicidad por ID

    variantes.forEach(variante => {
        // Buscamos el objeto de valor que corresponde al 'Color'
        const valorColor = variante.valores.find(v => v.atributo.nombre === "Color");


        if (valorColor) {
            // Guardamos el color usando su ID como clave para evitar duplicados

            const hexCode = colorHexMap[valorColor.valor] || "#CCCCCC";

            coloresDisponibles.set(valorColor.id, {
                id: valorColor.id,
                valor: valorColor.valor, // Ej: "Negro", "Gris"
                hex: hexCode
            });
        }
    });

    // Convertimos el Map de vuelta a un array de objetos para el frontend
    return Array.from(coloresDisponibles.values());
}

export const obtenerTallas = (producto: Productos): resultTallas[] => {
    const variantes = producto.variantes;
    const tallasDisponibles = new Map(); // Usamos Map para manejar la unicidad por ID

    variantes.forEach(variante => {
        // Buscamos el objeto de valor que corresponde a la 'Talla'
        const valorTalla = variante.valores.find(v => v.atributo.nombre === "Talla");

        if (valorTalla) {
            // Guardamos la talla usando su ID como clave para evitar duplicados
            tallasDisponibles.set(valorTalla.id, {
                id: valorTalla.id,
                valor: valorTalla.valor // Ej: "S", "M", "L"
            });
        }
    });

    // Convertimos el Map de vuelta a un array de objetos para el frontend
    return Array.from(tallasDisponibles.values());
}


type SeleccionesUsuario = {
    [nombreAtributo: string]: string; // Ej: { "Talla": "M", "Color": "Negro" }
};

interface InfoPrecio {
    variante_id: number;
    precio: string;
    precio_oferta: string | null;
    sku: string;
    stock_total: number;
    imagen_variante_url: string | null;
}

export const obtenerInfoPrecioVariante = (
    producto: Productos,
    seleccionesUsuario: SeleccionesUsuario
): InfoPrecio | null => {

    console.log('🔍 obtenerInfoPrecioVariante - Iniciando búsqueda');
    console.log('Selecciones del usuario:', seleccionesUsuario);

    const nombresAtributosSeleccionados = Object.keys(seleccionesUsuario);

    console.log('Atributos seleccionados:', nombresAtributosSeleccionados);

    if (nombresAtributosSeleccionados.length === 0) {
        console.log('❌ No hay selecciones para buscar');
        return null; // No hay selecciones para buscar
    }

    const varianteEncontrada = producto.variantes.find((variante) => {
        console.log(`\n🔎 Evaluando variante ID ${variante.id}, SKU: ${variante.sku}`);
        console.log('Valores de la variante:', variante.valores.map(v => ({
            atributo: v.atributo.nombre,
            valor: v.valor
        })));

        // Verificamos que CADA atributo seleccionado por el usuario coincida con un valor en la variante.
        // CAMBIO: Ya no requerimos que el número de atributos sea exacto, solo que los seleccionados coincidan
        const esCoincidenciaExacta = nombresAtributosSeleccionados.every((nombreAtributo) => {
            const valorEsperado = seleccionesUsuario[nombreAtributo];

            // Si el valor está vacío, lo ignoramos (no está realmente seleccionado)
            if (!valorEsperado || valorEsperado === '') {
                console.log(`  ⚠️ Saltando atributo vacío: ${nombreAtributo}`);
                return true; // No validamos atributos vacíos
            }

            console.log(`  Buscando: ${nombreAtributo} = "${valorEsperado}"`);

            // Buscamos dentro de los valores de la variante
            const encontrado = variante.valores.some((valorVariante) => {
                const coincide = valorVariante.atributo.nombre === nombreAtributo &&
                    valorVariante.valor === valorEsperado;
                console.log(`    ¿${valorVariante.atributo.nombre} (${valorVariante.valor}) === ${nombreAtributo} (${valorEsperado})? ${coincide}`);
                return coincide;
            });

            console.log(`  Resultado para ${nombreAtributo}: ${encontrado ? '✅' : '❌'}`);
            return encontrado;
        });

        console.log(`Coincidencia exacta: ${esCoincidenciaExacta ? '✅ SÍ' : '❌ NO'}`);
        return esCoincidenciaExacta;
    });

    if (varianteEncontrada) {
        console.log('✅ VARIANTE ENCONTRADA:', varianteEncontrada.sku);
        console.log('Stock total:', varianteEncontrada.stock_total);
        // Retornamos el tipo 'InfoPrecio' que es lo que el frontend necesita para actualizar la UI
        return {
            variante_id: varianteEncontrada.id,
            precio: varianteEncontrada.precio,
            precio_oferta: varianteEncontrada.precio_oferta,
            sku: varianteEncontrada.sku,
            stock_total: varianteEncontrada.stock_total,
            imagen_variante_url: varianteEncontrada.imagen_variante_url,
        };
    }

    console.log('❌ NO SE ENCONTRÓ NINGUNA VARIANTE QUE COINCIDA');
    return null;
}