# Adri Pets

Site de captação da hospedagem familiar Adri Pets: orçamento automático (PIX e cartão) e envio para o WhatsApp.

- Especificação: [docs/ESPEC.md](docs/ESPEC.md)
- Regras para agentes de IA: [AGENTS.md](AGENTS.md)
- Preços, taxas, telefone e datas lotadas: [src/config/site.config.ts](src/config/site.config.ts)

## Comandos

| Comando | O que faz |
|---|---|
| `pnpm install` | Instala as dependências |
| `pnpm dev` | Servidor local em http://localhost:4321 |
| `pnpm check` | Tipos e lint |
| `pnpm test` | Testes do motor de orçamento |
| `pnpm test:e2e` | Testes do simulador no navegador |
| `pnpm build` | Gera o site estático em `dist/` |
