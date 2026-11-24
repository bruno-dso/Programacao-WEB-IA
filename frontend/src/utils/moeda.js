// Formata um número como moeda brasileira: 1234.5 -> "R$ 1.234,50"
export function moeda(valor) {
    return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}