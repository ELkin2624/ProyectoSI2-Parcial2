
export const currencyFormatter = (value: number) => {
    return value.toLocaleString('es-BO', {
        style: 'currency',
        currency: 'BOB',
        minimumFractionDigits: 2,
    })
}