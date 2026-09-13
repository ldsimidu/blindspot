/** Normalizes Brazilian CNPJ input without asserting that the organization exists. */
export function normalizeCnpj(value: unknown): string {
  return typeof value === "string" ? value.replace(/\D/g, "") : "";
}

/** Formats only the digits available so people can type a CNPJ progressively. */
export function formatCnpj(value: unknown): string {
  const digits = normalizeCnpj(value).slice(0, 14);
  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2}\.\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{2}\.\d{3}\.\d{3})(\d)/, "$1/$2")
    .replace(/^(\d{2}\.\d{3}\.\d{3}\/\d{4})(\d{1,2})$/, "$1-$2");
}

export function isValidCnpj(value: unknown): boolean {
  const cnpj = normalizeCnpj(value);
  if (!/^\d{14}$/.test(cnpj) || /^(\d)\1{13}$/.test(cnpj)) {
    return false;
  }

  return checkDigit(cnpj.slice(0, 12), 5) === Number(cnpj[12])
    && checkDigit(cnpj.slice(0, 13), 6) === Number(cnpj[13]);
}

function checkDigit(digits: string, initialWeight: number): number {
  let weight = initialWeight;
  const total = digits.split("").reduce((sum, digit) => {
    const next = sum + Number(digit) * weight;
    weight = weight === 2 ? 9 : weight - 1;
    return next;
  }, 0);
  const remainder = total % 11;
  return remainder < 2 ? 0 : 11 - remainder;
}
