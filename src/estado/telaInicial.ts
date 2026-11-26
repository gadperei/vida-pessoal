export type TelaInicial = 'app' | 'configurar' | 'aguardar';

/**
 * Sem config no aparelho, só oferece a configuração inicial depois de confirmar com o servidor
 * que não há nada lá. Senão, quem já usa o app (num aparelho novo, com a rede falhando) poderia
 * configurar tudo de novo por cima dos próprios dados.
 */
export function telaInicial(p: { temConfig: boolean; baixouDoServidor: boolean }): TelaInicial {
  if (p.temConfig) return 'app';
  return p.baixouDoServidor ? 'configurar' : 'aguardar';
}
