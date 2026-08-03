export function aplicarMascaraTelefone(value: string): string {
  const cleaned = value.replace(/\D/g, '').slice(0, 11);
  if (cleaned.length >= 6) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  } else if (cleaned.length >= 2) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
  }
  return cleaned;
}

export function aplicarMascaraCPF(value: string): string {
  const cleaned = value.replace(/\D/g, '').slice(0, 11);
  if (cleaned.length >= 9) {
    return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9)}`;
  } else if (cleaned.length >= 6) {
    return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6)}`;
  } else if (cleaned.length >= 3) {
    return `${cleaned.slice(0, 3)}.${cleaned.slice(3)}`;
  }
  return cleaned;
}

export function aplicarMascaraRG(value: string): string {
  const cleaned = value.replace(/\D/g, '').slice(0, 9);
  if (cleaned.length >= 8) {
    return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}-${cleaned.slice(8)}`;
  } else if (cleaned.length >= 5) {
    return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5)}`;
  } else if (cleaned.length >= 2) {
    return `${cleaned.slice(0, 2)}.${cleaned.slice(2)}`;
  }
  return cleaned;
}

export function aplicarMascaraCEP(value: string): string {
  const cleaned = value.replace(/\D/g, '').slice(0, 8);
  if (cleaned.length === 8) {
    return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
  } else if (cleaned.length >= 5) {
    return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
  }
  return cleaned;
}

export function applyMask(value: string, type: 'cpf' | 'phone' | 'cep' | 'rg'): string {
  switch (type) {
    case 'cpf':
      return aplicarMascaraCPF(value);
    case 'phone':
      return aplicarMascaraTelefone(value);
    case 'cep':
      return aplicarMascaraCEP(value);
    case 'rg':
      return aplicarMascaraRG(value);
    default:
      return value;
  }
}

export function validateCPF(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleaned)) return false;
  
  let sum = 0;
  let remainder;
  
  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cleaned.substring(i - 1, i)) * (11 - i);
  }
  
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleaned.substring(9, 10))) return false;
  
  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cleaned.substring(i - 1, i)) * (12 - i);
  }
  
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleaned.substring(10, 11))) return false;
  
  return true;
}

export function validatePhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length === 10 || cleaned.length === 11;
}

export function validateCEP(cep: string): boolean {
  const cleaned = cep.replace(/\D/g, '');
  return cleaned.length === 8;
}
