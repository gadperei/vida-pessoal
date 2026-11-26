import { Bar, BarChart, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { duracao, rotuloDia } from '../regras/datas.ts';
import type { Dia, TipoDia } from '../regras/tipos.ts';

interface Noite { dia: Dia; minutos: number; tipo: TipoDia }

const COR: Record<TipoDia, string> = { T: 'var(--grafico-trabalho)', F: 'var(--grafico-folga)' };
const NOME: Record<TipoDia, string> = { T: 'antes de trabalho', F: 'antes de folga' };

function Dica({ active, payload }: { active?: boolean; payload?: { payload: Noite }[] }) {
  const n = active ? payload?.[0]?.payload : undefined;
  if (!n) return null;
  return (
    <div className="grafico-dica">
      <strong>{rotuloDia(n.dia)}</strong> · {duracao(n.minutos)}
      <span className="campo-dica"> · {NOME[n.tipo]}</span>
    </div>
  );
}

/** Uma barra por noite, colorida pelo dia seguinte (trabalho/folga), com a linha da meta. */
export function GraficoSono({ noites, metaMin }: { noites: Noite[]; metaMin: number }) {
  if (noites.length === 0) return <p className="campo-dica">Nenhuma noite registrada neste mês.</p>;
  const teto = Math.ceil(Math.max(metaMin, ...noites.map((n) => n.minutos)) / 120) * 120;
  const marcas = Array.from({ length: teto / 120 + 1 }, (_, i) => i * 120).filter((m) => m % 240 === 0 || m === teto);
  const dados = noites.map((n) => ({ ...n, rotulo: n.dia.slice(8, 10) }));

  return (
    <figure className="grafico-sono">
      <div className="legenda" aria-hidden="true">
        <span><i style={{ background: COR.T }} /> noite antes de trabalho</span>
        <span><i style={{ background: COR.F }} /> antes de folga</span>
        <span><i className="legenda-linha" /> meta {duracao(metaMin)}</span>
      </div>
      <div aria-hidden="true">
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={dados} margin={{ top: 8, right: 4, left: 0, bottom: 0 }} barCategoryGap={2}>
            <XAxis dataKey="rotulo" tickLine={false} axisLine={{ stroke: 'var(--borda)' }} interval="preserveStartEnd" minTickGap={12} tick={{ fontSize: 11, fill: 'var(--texto-suave)' }} />
            <YAxis width={32} domain={[0, teto]} ticks={marcas} tickFormatter={(m: number) => `${m / 60}h`} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'var(--texto-suave)' }} />
            <Tooltip content={<Dica />} cursor={{ fill: 'var(--superficie-2)' }} />
            <ReferenceLine y={metaMin} stroke="var(--texto-suave)" strokeWidth={1.5} />
            <Bar dataKey="minutos" maxBarSize={24} radius={[4, 4, 0, 0]} isAnimationActive={false}>
              {dados.map((n) => <Cell key={n.dia} fill={COR[n.tipo]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <details className="grafico-tabela">
        <summary>Ver noite a noite</summary>
        <table>
          <thead><tr><th scope="col">Manhã</th><th scope="col">Dormiu</th><th scope="col">Dia seguinte</th></tr></thead>
          <tbody>
            {noites.map((n) => (
              <tr key={n.dia}><td>{rotuloDia(n.dia)}</td><td className="num">{duracao(n.minutos)}</td><td>{n.tipo === 'T' ? 'trabalho' : 'folga'}</td></tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
