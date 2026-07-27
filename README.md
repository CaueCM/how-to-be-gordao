# How To Be Gordão

App de metas e progresso pessoal: cadastre "missões" (planos), crie metas numéricas, tarefas com prazo ou hábitos recorrentes, e acompanhe tudo com check-ins diários/semanais.

Recriado a partir do handoff de design em `design_handoff_gordao_app/` — ver `plano-telas.md` para o brief original de telas.

## Stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript
- Tailwind CSS v4
- Zustand (estado + persistência em localStorage)
- lucide-react (ícones)

## Rodando localmente

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Build estático (GitHub Pages)

```bash
npm run build
```

Gera o site estático em `out/`. O deploy para o GitHub Pages roda automaticamente via GitHub Actions (`.github/workflows/deploy.yml`) a cada push em `main`.

## O que é mock (por enquanto)

- Login "Entrar com Google" e a conexão com o Google Calendar são simulados — ainda não há OAuth real nem eventos reais criados no Calendar.
- Os dados ficam salvos no `localStorage` do navegador, não em um banco compartilhado entre dispositivos.
