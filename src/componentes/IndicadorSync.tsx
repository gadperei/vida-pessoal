import { useBanco } from '../estado/contexto.tsx';

/** Aviso discreto no topo quando está sem internet. */
export function IndicadorSync() {
  const { status } = useBanco();
  if (status.online) return null;
  const n = status.pendentes;
  const texto = n === 0 ? 'Sem internet' : n === 1 ? '1 alteração esperando internet' : `${n} alterações esperando internet`;
  return <div className="indicador-sync" role="status">{texto}</div>;
}
