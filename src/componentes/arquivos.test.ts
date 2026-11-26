import { describe, expect, it } from 'vitest';
import { arquivoParaCompartilhar } from './arquivos.ts';

describe('arquivoParaCompartilhar', () => {
  const aceitaTudo = () => true;

  it('no celular, oferece o arquivo como .txt (o Chrome do Android recusa .json)', async () => {
    const f = arquivoParaCompartilhar('vida-pessoal-2026-11-26.json', '{"a":1}', true, aceitaTudo);
    expect(f?.name).toBe('vida-pessoal-2026-11-26.txt');
    expect(f?.type).toBe('text/plain');
    expect(await f?.text()).toBe('{"a":1}');
  });

  it('no computador, ou sem suporte a compartilhar arquivos, baixa', () => {
    expect(arquivoParaCompartilhar('vida-pessoal-2026-11-26.json', '{}', false, aceitaTudo)).toBeNull();
    expect(arquivoParaCompartilhar('vida-pessoal-2026-11-26.json', '{}', true, () => false)).toBeNull();
  });
});
