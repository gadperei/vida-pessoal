import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { aplicar, semExcluidos, type Mudanca } from '../dados/banco.ts';
import { enfileirar } from '../dados/fila.ts';
import { carregarLocal, salvarLocal } from '../dados/persistencia.ts';
import { criarRemoto } from '../dados/remoto.ts';
import { precisaOutraRodada, sincronizar, type EstadoLocal } from '../dados/sincronizador.ts';
import { bancoVazio, type Banco } from '../regras/tipos.ts';
import { cliente } from '../supabase.ts';
import { useOnline } from './useOnline.ts';

export interface StatusSync { pendentes: number; online: boolean; sincronizando: boolean }

export interface ValorBanco {
  /** Já sem as linhas excluídas. */
  banco: Banco;
  salvar(m: Mudanca | Mudanca[]): void;
  status: StatusSync;
  userId: string;
  /** Dados locais carregados e a primeira sincronização tentada (ou sem internet). */
  pronto: boolean;
  /** Alguma sincronização completa (envio + busca) já deu certo desde que o app abriu. */
  baixouDoServidor: boolean;
  sincronizarAgora(): void;
  aviso: string | null;
  avisar(mensagem: string): void;
  limparAviso(): void;
}

const Contexto = createContext<ValorBanco | null>(null);

export function useBanco(): ValorBanco {
  const v = useContext(Contexto);
  if (!v) throw new Error('useBanco fora do BancoProvider');
  return v;
}

const vazio = (): EstadoLocal => ({ banco: bancoVazio(), fila: [], cursores: {} });

export function BancoProvider({ userId, children }: { userId: string; children: ReactNode }) {
  const online = useOnline();
  const [estado, setEstado] = useState<EstadoLocal>(vazio);
  const [carregado, setCarregado] = useState(false);
  const [sincronizouUmaVez, setSincronizouUmaVez] = useState(false);
  const [baixouDoServidor, setBaixouDoServidor] = useState(false);
  const [sincronizando, setSincronizando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  const atual = useRef<EstadoLocal>(vazio());
  const carregadoRef = useRef(false);
  const emAndamento = useRef(false);
  const duranteSync = useRef<Mudanca[]>([]);
  const agendado = useRef<number | null>(null);
  const remoto = useMemo(() => criarRemoto(cliente, userId), [userId]);

  const gravar = useCallback((e: EstadoLocal) => {
    atual.current = e;
    setEstado(e);
    void salvarLocal(userId, e);
  }, [userId]);

  const sincronizarAgora = useCallback(async () => {
    if (emAndamento.current || !carregadoRef.current) return;
    emAndamento.current = true;
    setSincronizando(true);
    let deNovo = false;
    try {
      const r = await sincronizar(atual.current, remoto);
      // Alterações feitas enquanto sincronizava: reaplicar por cima do resultado.
      let e = r.estado;
      for (const m of duranteSync.current) e = { ...e, banco: aplicar(e.banco, m), fila: enfileirar(e.fila, m) };
      duranteSync.current = [];
      gravar(e);
      if (!r.offline) setBaixouDoServidor(true);
      deNovo = precisaOutraRodada(r.offline, e.fila);
      if (r.rejeitadas.length > 0) {
        setAviso(r.rejeitadas.length === 1 ? 'Uma alteração não pôde ser salva.' : `${r.rejeitadas.length} alterações não puderam ser salvas.`);
      }
    } finally {
      emAndamento.current = false;
      setSincronizando(false);
      setSincronizouUmaVez(true);
    }
    // Algo foi salvo enquanto esta rodada acontecia: manda já, sem esperar o próximo gatilho.
    if (deNovo) void sincronizarAgoraRef.current();
  }, [remoto, gravar]);
  const sincronizarAgoraRef = useRef(sincronizarAgora);
  sincronizarAgoraRef.current = sincronizarAgora;

  // Abrir: dados do aparelho primeiro, depois o servidor.
  useEffect(() => {
    let vivo = true;
    carregarLocal(userId).then((local) => {
      if (!vivo) return;
      const e = local ?? vazio();
      atual.current = e;
      setEstado(e);
      carregadoRef.current = true;
      setCarregado(true);
      void sincronizarAgora();
    });
    return () => { vivo = false; };
  }, [userId, sincronizarAgora]);

  // Sincronizar ao voltar a internet, ao voltar para o app e a cada 60 s com o app visível.
  useEffect(() => {
    const seVisivel = () => { if (document.visibilityState === 'visible') void sincronizarAgora(); };
    window.addEventListener('online', seVisivel);
    document.addEventListener('visibilitychange', seVisivel);
    const id = window.setInterval(seVisivel, 60_000);
    return () => {
      window.removeEventListener('online', seVisivel);
      document.removeEventListener('visibilitychange', seVisivel);
      window.clearInterval(id);
    };
  }, [sincronizarAgora]);

  const salvar = useCallback((m: Mudanca | Mudanca[]) => {
    const lista = Array.isArray(m) ? m : [m];
    let e = atual.current;
    for (const x of lista) e = { ...e, banco: aplicar(e.banco, x), fila: enfileirar(e.fila, x) };
    if (emAndamento.current) duranteSync.current.push(...lista);
    gravar(e);
    if (agendado.current !== null) window.clearTimeout(agendado.current);
    agendado.current = window.setTimeout(() => { agendado.current = null; void sincronizarAgora(); }, 1000);
  }, [gravar, sincronizarAgora]);

  const limparAviso = useCallback(() => setAviso(null), []);
  const banco = useMemo(() => semExcluidos(estado.banco), [estado.banco]);
  const valor: ValorBanco = {
    banco,
    salvar,
    status: { pendentes: estado.fila.length, online, sincronizando },
    userId,
    pronto: carregado && (sincronizouUmaVez || !online || estado.banco.config.length > 0),
    baixouDoServidor,
    sincronizarAgora: () => { void sincronizarAgora(); },
    aviso,
    avisar: setAviso,
    limparAviso,
  };
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}
