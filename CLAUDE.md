# CLAUDE.md — Garu Estatística

## Visão Geral do Projeto

**GARU Estatística** é uma plataforma web interativa de ensino e aprendizagem de estatística voltada para estudantes da área da saúde. É parte de um **TCC (Trabalho de Conclusão de Curso)** da UNIFESP. O nome "GARU" faz referência ao grupo acadêmico. A aplicação substitui uma versão anterior feita em R/Shiny por uma SPA moderna em React+TypeScript.

O aplicativo permite que os estudantes:
- Visualizem e explorem conjuntos de dados reais da saúde
- Aprendam conceitos de estatística descritiva, probabilidade e inferência de forma interativa
- Importem seus próprios arquivos CSV e apliquem todas as ferramentas da plataforma ("Meu Laboratório")
- Pratiquem com exercícios teóricos e práticos

**Idioma da interface:** Português brasileiro (pt-BR). Toda a UI, labels, textos explicativos e formatação numérica usam o padrão BR (vírgula como separador decimal).

---

## Stack Tecnológica

| Camada | Tecnologia | Versão |
|---|---|---|
| Framework | React | 19.x |
| Linguagem | TypeScript | ~5.9 |
| Bundler | Vite | 7.x |
| UI Library | Mantine | 8.x (`@mantine/core`, `@mantine/hooks`, `@mantine/charts`) |
| Ícones | Tabler Icons React | 3.x |
| Gráficos | Recharts | 3.x |
| Fórmulas LaTeX | KaTeX + react-katex | 0.16+ |
| Estatística | jstat | 1.9.x (distribuições de probabilidade) |
| Parsing CSV | PapaParse | 5.x |
| Estado Global | Zustand | 5.x |
| Roteamento | React Router DOM | 7.x |
| Exportação | html-to-image | 1.x |
| Testes | Vitest | 4.x |
| Linting | ESLint | 9.x |
| Deploy | Docker (multi-stage: Node→Nginx interno) na porta **3838** |

---

## Comandos Essenciais

```bash
npm run dev        # Servidor de desenvolvimento (Vite)
npm run build      # Build de produção (tsc -b && vite build)
npm run test       # Testes unitários (vitest)
npm run test:ui    # Testes com interface visual
npm run lint       # ESLint
npm run preview    # Preview do build de produção
```

---

## Arquitetura e Estrutura de Diretórios

```
src/
├── main.tsx                    # Entry point: MantineProvider + BrowserRouter + App
├── App.tsx                     # Rotas com React.lazy + Suspense
├── App.css                     # Estilos específicos do App (mínimo)
├── theme.ts                    # Tema Mantine (primaryColor: 'cyan', font: Inter)
├── index.css                   # Estilos globais (background dot pattern, animations)
├── vite-env.d.ts               # Type declarations para jstat e react-katex
│
├── components/                 # Componentes reutilizáveis
│   ├── PageWrapper.tsx         # Layout wrapper para todas as páginas (breadcrumb + título + FloatingNav)
│   ├── Sidebar.tsx             # Sidebar de navegação (usado em layouts alternativos/UX tests)
│   ├── AppBreadcrumb.tsx       # Breadcrumb automático baseado em navigation.ts
│   ├── FloatingNav.tsx         # Botão flutuante "Home" (fixed, bottom-right)
│   ├── FormulaBlock.tsx        # Wrapper para KaTeX (BlockMath/InlineMath)
│   ├── CollapsibleSection.tsx  # Seção "Mostrar mais/menos" (Mantine Collapse)
│   ├── DataDictionaryModal.tsx # Modal para exibir dicionário de dados
│   └── calculators/            # Componentes genéricos reutilizáveis (ver seção abaixo)
│
├── pages/                      # Páginas (cada uma = uma rota)
│   ├── LayoutAppsMock.tsx      # HOME: Grid de pastas/apps estilo iOS
│   ├── Projeto.tsx             # Sobre o projeto
│   ├── Equipe.tsx              # Equipe
│   ├── Contato.tsx             # Contato
│   ├── ConjuntoDados.tsx       # Visualização dos datasets embutidos
│   ├── MeuLaboratorio.tsx      # Upload CSV + todas as ferramentas
│   ├── TiposVariaveis.tsx      # Classificação de variáveis
│   ├── TabelaFrequencias.tsx   # Tabelas de frequência
│   ├── MedidasResumo.tsx       # Medidas de posição e dispersão (gerador interativo)
│   ├── GraficosQualitativos.tsx
│   ├── GraficosQuantitativos.tsx
│   ├── GraficosBidimensionais.tsx
│   ├── Distribuicoes.tsx       # Normal, Bernoulli, Binomial, Poisson, Expo, Chi², t-Student
│   ├── TesteT.tsx              # Teste Z (1 amostra) e t-pareado (2 pop. dependentes)
│   ├── TesteQuiQuadrado.tsx    # Wrapper → GenericQuiQuadrado
│   ├── TesteCorrelacao.tsx     # Wrapper → GenericTesteCorrelacao
│   ├── ExerciciosTeoricos.tsx  # Exercícios de múltipla escolha
│   ├── ExerciciosPraticos.tsx  # Exercícios guiados sobre os dados reais
│   ├── Layout*Mock.tsx         # Protótipos de layout (testes de usabilidade UX)
│
├── stores/                     # Estado global (Zustand)
│   ├── useDataStore.ts         # Dataset ativo ('alimentacao' | 'paralisia')
│   ├── useSummaryStore.ts      # Gerador de elementos aleatórios para Medidas Resumo
│   └── useCustomLabStore.ts    # Dados importados pelo usuário (persistido em localStorage)
│
├── data/                       # Dados estáticos
│   ├── index.ts                # Barrel exports + helpers (getColumnValues, getNumericValues, getFactorValues)
│   ├── navigation.ts           # Estrutura de pastas/apps para a home e breadcrumbs
│   ├── dataDictionaries.ts     # Dicionários descritivos dos datasets
│   ├── dadosSaudeAlimentacao.ts # Dataset principal (~125 registros de saúde alimentar)
│   ├── dadosParalisia.ts       # Dataset de paralisia cerebral em crianças
│   ├── exercIdosos.ts          # Dataset para exercícios práticos (idosos)
│   └── exercImc.ts             # Dataset para exercícios práticos (IMC)
│
├── utils/                      # Funções utilitárias puras
│   ├── statistics.ts           # Funções estatísticas: mean, median, quartiles, iqr, variance, std, 
│   │                           # frequencyTable, contingencyTable, chiSquare, pearson, spearman, shapiroWilk
│   ├── distributions.ts        # Wrappers jstat: dnorm/pnorm/qnorm, dt/pt/qt, dchisq, dbinom, dpois, dexp,
│   │                           # + generateCurveData, generateShadedCurveData, rnorm
│   ├── formatting.ts           # formatBR (vírgula decimal), formatPValue, formatPercent, parseBR
│   ├── colors.ts               # Paleta de cores: COLORFUL, BLUE_SCALE, MEDIUM_CYAN, RED_NAIL, etc.
│   ├── csvParser.ts            # parseCustomCSV: PapaParse → inferência automática de tipos (numérico vs fator)
│   ├── exportChart.ts          # exportChartAsPNG: html-to-image → download PNG
│   ├── statistics.test.ts      # Testes unitários para statistics.ts
│   └── distributions.test.ts   # Testes unitários para distributions.ts
│
└── assets/
    ├── react.svg               # Logo React (default do Vite template)
    └── images/
        ├── garu_3.png          # Logo do GARU
        ├── garu_variaveis.png  # Imagem ilustrativa de tipos de variáveis
        ├── alessandra.jpg      # Foto da equipe
        ├── camila.jpg          # Foto da equipe
        ├── flavia.jpg          # Foto da equipe
        ├── gabriel.jpg         # Foto da equipe
        ├── joao.jpg            # Foto da equipe
        ├── leonardo.png        # Foto da equipe
        └── paulopaiva.jpg      # Foto da equipe
```

---

## Padrões e Convenções

### Criação de Novas Páginas

1. Criar o componente em `src/pages/NomePagina.tsx`
2. Usar `export default` (obrigatório para `React.lazy`)
3. Envolver com `<PageWrapper>` para ter breadcrumb, título, FloatingNav e background padrão
4. Registrar a rota lazy em `src/App.tsx`
5. Adicionar à navegação em `src/data/navigation.ts` (em `folders` ou `standaloneItems`)

### Padrão de Página
```tsx
import PageWrapper from '../components/PageWrapper';

export default function NomePagina() {
  return (
    <PageWrapper size="xl">
      {/* conteúdo */}
    </PageWrapper>
  );
}
```

### Componentes Calculadores Genéricos (`components/calculators/`)

Estes componentes são **reutilizáveis** tanto pelas páginas fixas (com datasets embutidos) quanto pelo "Meu Laboratório" (com dados do usuário). Todos recebem `dataset` e listas de colunas como props:

| Componente | Props Principais | Função |
|---|---|---|
| `GenericMedidasResumo` | `dataset`, `numericCols` | Tabela com média, mediana, variância, DP, etc. |
| `GenericTabelaFrequencias` | `dataset`, `factorCols` | Tabela de frequência para variáveis categóricas |
| `GenericTesteT` | `dataset`, `numericCols`, `factorCols` | Teste t para uma amostra (Z ou t) |
| `GenericQuiQuadrado` | `dataset`, `factorCols` | Tabela de contingência + teste chi-quadrado |
| `GenericTesteCorrelacao` | `dataset`, `numericCols` | Pearson + Spearman + scatter plot |
| `GraficoUnivariavel` | `dataset`, `numericCols`, `factorCols` | Gráficos univariados (barras, pizza, histograma, boxplot) |
| `GraficoBivariavel` | `dataset`, `numericCols`, `factorCols` | Gráficos bivariados (scatter, barras agrupadas, etc.) |
| `DataTableView` | `dataset`, `columns` | Visualização tabular dos dados brutos |
| `CategoryOrderControl` | (controle interno) | Reordenação de categorias para gráficos |
| `CustomXAxisTick` | (componente Recharts) | Tick customizado para eixo X |

### Gráficos (Recharts)
- Usar sempre `<ResponsiveContainer>` com `width="100%"` e `height` fixo
- Formatação dos valores: `formatBR` para números, `formatPercent` para percentuais
- Cores padrão: importar de `utils/colors.ts` (COLORFUL, MEDIUM_CYAN, RED_NAIL, etc.)
- Tooltips e labels em português
- `isAnimationActive={false}` nas distribuições para evitar lag durante sliders

### Formatação Numérica
- **Sempre usar** `formatBR()` de `utils/formatting.ts` para exibir números na interface
- Vírgula como separador decimal (padrão brasileiro): `1.234,56`
- Porcentagens: `formatPercent()` → `"45,3%"`
- P-valores: `formatPValue()` → `"< 0,0001"` quando muito pequeno

### Estado Global (Zustand)
- Stores em `src/stores/`
- Usar `create<Interface>()` sem context/providers
- `useCustomLabStore` usa `persist` middleware para localStorage (key: `garu-custom-lab-storage`)
- Datasets ativos controlados por `useDataStore`

### Fórmulas Matemáticas
- Usar `<FormulaBlock formula={String.raw`...`} />` para fórmulas LaTeX em bloco
- Usar `<FormulaBlock formula="..." inline />` para fórmulas inline
- KaTeX CSS importado em `main.tsx`

---

## Dados Embutidos

### 1. Saúde e Alimentação (`dadosSaudeAlimentacao`)
- ~125 registros de estudantes universitários
- 21 variáveis (8 numéricas + 13 categóricas)
- Exporta: `FACTOR_COLUMNS`, `NUMERIC_COLUMNS`, `SHORT_LEVEL_COLUMNS`
- Usado pela maioria das páginas descritivas e inferência

### 2. Paralisia Cerebral (`dadosParalisia`)
- ~100 crianças com e sem paralisia cerebral
- 9 variáveis: sexo, idade, grupo, perda auditiva, DMO, tempos de deglutição
- Exporta: `DISPLAY_NAMES` (mapeamento chave interna → nome exibível)

### 3. Exercícios (`exercIdosos`, `exercImc`)
- Datasets menores para exercícios práticos guiados

### Acesso a colunas
```ts
import { getNumericValues, getFactorValues } from '../data';
const pesos = getNumericValues(dataset, 'Peso');      // number[] sem nulls
const sexos = getFactorValues(dataset, 'Sexo');        // string[]
```

---

## Funções Estatísticas (utils/statistics.ts)

Funções puras, sem estado. **Quartis usam o método R type 7 (padrão do R).**

| Função | Descrição |
|---|---|
| `mean(values)` | Média aritmética |
| `median(values)` | Mediana |
| `quartiles(values)` | Q1, Q2, Q3 (R type 7) |
| `iqr(values)` | Distância interquartílica |
| `populationVariance(values)` | Variância populacional (÷n) |
| `sampleVariance(values)` | Variância amostral (÷n-1) |
| `populationStdDev(values)` / `sampleStdDev(values)` | Desvios padrão |
| `standardError(values)` | Erro padrão da média |
| `getMode(values)` / `getModeStr(values)` | Moda(s) numérica/string |
| `frequencyTable(values, order?)` | Tabela de frequência categórica |
| `frequencyTableIntervals(values, breaks)` | Tabela de frequência por intervalos |
| `contingencyTable(var1, var2, order1?, order2?)` | Tabela de contingência (linhas × colunas) |
| `expectedFrequencies(observed)` | Frequências esperadas para chi-quadrado |
| `chiSquareStatistic(observed, expected)` | Estatística χ² |
| `pearsonCorrelation(x, y)` | Correlação de Pearson |
| `spearmanCorrelation(x, y)` | Correlação de Spearman (rank-based) |
| `shapiroWilk(values)` | Teste de normalidade Shapiro-Wilk (aproximado) |
| `generateRandomElements(count, min, max, type)` | Gera amostra aleatória ordenada |
| `getNiceTicks(min, max, maxTicks)` | Calcula ticks legíveis para eixos |

---

## Distribuições (utils/distributions.ts)

Wrappers sobre `jstat` com convenção de nomes inspirada no R:

| Função | Distribuição | Tipo |
|---|---|---|
| `dnorm`, `pnorm`, `qnorm` | Normal | PDF, CDF, Quantil |
| `dt`, `pt`, `qt` | t-Student | PDF, CDF, Quantil |
| `dchisq`, `pchisq`, `qchisq` | Chi-quadrado | PDF, CDF, Quantil |
| `dbinom`, `pbinom` | Binomial | PMF, CDF |
| `dpois`, `ppois` | Poisson | PMF, CDF |
| `dexp`, `pexp` | Exponencial | PDF, CDF |
| `rnorm(n, mean, sd)` | Normal | Gerador de amostras |
| `generateCurveData(pdfFn, xMin, xMax, points)` | — | Gera pontos para plotar curvas |
| `generateShadedCurveData(...)` | — | Gera pontos com shading para áreas sob a curva |

---

## Deploy (Docker)

O app roda em uma **máquina virtual (VM)** dentro do servidor da UNIFESP. O servidor utiliza o **Docker Compose** para orquestrar o container, automatizando a substituição da versão antiga pela nova.

O fluxo de deploy é:

1. **Build local:** Construir a imagem Docker na máquina de desenvolvimento com a tag `garu-novo` (conforme configurado no `docker-compose.yml` do servidor)
2. **Envio:** Transferir a imagem compactada (`.tar`) para a pasta HOME do servidor via SSH
3. **Atualização:** Carregar a imagem no servidor e pedir para o Compose atualizar o serviço

O roteamento da URL pública é gerenciado pela infraestrutura da universidade (fora do controle do projeto).

```bash
# Na sua máquina local: Build e exportação
docker build -t garu-novo .
docker save garu-novo -o garu-novo.tar
scp garu-novo.tar seu_usuario@ip_do_servidor:~

# No servidor remoto: Atualização automática
docker load -i garu-novo.tar
docker-compose up -d
```

> **Nota:** O comando `docker-compose up -d` automaticamente detecta que a imagem `garu-novo` foi alterada pelo `docker load`, e se encarrega de parar, remover e recriar o container `Garu_vTs1` de forma transparente na porta 3838.

### Detalhes do Dockerfile

O `Dockerfile` usa build multi-stage internamente:
- **Stage 1 (builder):** `node:20-alpine` → `npm ci` → `npm run build` → gera os arquivos estáticos em `/app/dist`
- **Stage 2 (server):** `nginx:alpine` → serve os arquivos estáticos na porta 3838 (Nginx é **interno** ao container, não roda no servidor remoto)
- `nginx.conf` inclui `try_files $uri $uri/ /index.html` para o React Router funcionar

---

## Testes

```bash
npm run test               # Roda todos os testes (vitest)
npm run test:ui             # Interface visual do vitest
```

Testes existentes:
- `src/utils/statistics.test.ts` — Testes unitários para todas as funções estatísticas
- `src/utils/distributions.test.ts` — Testes unitários para todas as distribuições e utilitários de curva

**Convenção:** Ao adicionar funções em `utils/`, criar testes correspondentes.

---

## Cuidados Importantes

1. **Não alterar os dados embutidos** sem coordenar com a monografia (TCC) — os datasets são referências do trabalho acadêmico
2. **Nomes das variáveis** nos datasets usam acentos e espaços em português (ex: `'Percepção de Saúde'`, `'Álcool: Consumo mensal'`)
3. **jstat não tem tipos nativos** — as declarations estão em `vite-env.d.ts`. Se adicionar novas funções do jstat, atualizar esse arquivo
4. **react-katex também não tem tipos** — declaração em `vite-env.d.ts`
5. **Todos os valores numéricos** exibidos na UI devem passar por `formatBR()` (vírgula decimal)
6. **As funções de quartil** seguem o padrão R (type 7) para compatibilidade com a disciplina de estatística
7. **O CSV parser** (`csvParser.ts`) faz inferência automática de tipos: aceita vírgula ou ponto como decimal, trata NA/N/A/null como nulo
8. **Lazy loading:** Todas as páginas usam `React.lazy()` — todo componente de página deve usar `export default`
9. **Acessibilidade:** Elementos interativos (cards, botões) incluem `tabIndex`, `role="button"` e handlers de teclado (Enter/Space)
10. **Tamanho de bundle:** Vite config tem `manualChunks` para separar react, mantine, recharts e math em chunks independentes

---

## Contexto Acadêmico

Este é um projeto de TCC da UNIFESP. A monografia associada está em `/home/user/TCC/Monografia/`. O projeto é uma migração de uma aplicação R/Shiny para React, mantendo os mesmos conceitos estatísticos e datasets. O público-alvo são estudantes de graduação em saúde (Biomedicina, Enfermagem, Fonoaudiologia, Medicina, Tecnologias) que cursam disciplinas de bioestatística.
