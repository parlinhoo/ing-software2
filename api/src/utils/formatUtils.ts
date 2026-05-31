export function isValidRut(rut: string) {
    if (!rut) return false;

    const rutString = rut.split("-");
    if (rutString.length !== 2 || rutString[1]!.length !== 1) return false;

    const rutBlocks = rutString[0]!.split(".");
    // si tiene puntos verificar que sea de a bloques de 3 (excepto inicio)
    if (rutBlocks.length > 1) {
        if (!rutBlocks || rutBlocks[0]!.length > 3) return false;
        for (let i = 1; i < rutBlocks.length; i++) {
            if (rutBlocks[i]!.length !== 3) return false;
        }
    }

    const rutDigits = rutBlocks.join("");
    const rutNumber = Number(rutDigits);
    if (isNaN(rutNumber)) return false;

    const invDigits = rutDigits.split("").reverse().join("");

    const factors = [2, 3, 4, 5, 6, 7] // para calcular digito verificador

    let sum = 0;
    for (let i = 0; i < invDigits.length; i++) {
        sum += Number(invDigits[i])*factors[i % factors.length]!;
    }
    const calculatedVerifDigit = 11 - (sum % 11);
    const verifDigit = rutString[1]!.toLowerCase();
    
    if (calculatedVerifDigit < 10 && calculatedVerifDigit.toString(10) !== verifDigit) return false;
    else if (calculatedVerifDigit === 10 && verifDigit !== "k") return false;
    else if (calculatedVerifDigit === 11 && verifDigit !== "0") return false;

    return true;
}