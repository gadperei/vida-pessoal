import { useState, type FormEvent } from 'react';
import { NOME_APP } from '../regras/tipos.ts';
import { cliente } from '../supabase.ts';

export function Entrar() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function entrar(ev: FormEvent) {
    ev.preventDefault();
    setErro(null);
    if (!navigator.onLine) {
      setErro('Sem internet. Conecte-se para entrar pela primeira vez.');
      return;
    }
    setEnviando(true);
    const { error } = await cliente.auth.signInWithPassword({ email: email.trim(), password: senha });
    setEnviando(false);
    if (!error) return; // a sessão nova troca a tela sozinha
    if (!navigator.onLine || /fetch|network/i.test(error.message)) setErro('Sem internet. Conecte-se para entrar pela primeira vez.');
    else if (error.status === 400) setErro('E-mail ou senha incorretos.');
    else setErro('Não deu para entrar agora. Tente de novo em instantes.');
  }

  return (
    <main className="entrar">
      <h1>{NOME_APP}</h1>
      <p className="campo-dica">Sua semana, seus hábitos e suas metas.</p>
      <form onSubmit={entrar} className="entrar">
        <div className="campo">
          <label htmlFor="email">E-mail</label>
          <input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="campo">
          <label htmlFor="senha">Senha</label>
          <input id="senha" type="password" autoComplete="current-password" required value={senha} onChange={(e) => setSenha(e.target.value)} />
        </div>
        {erro && <p className="campo-erro" role="alert">{erro}</p>}
        <button type="submit" className="botao botao-primario" disabled={enviando}>
          {enviando ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </main>
  );
}
