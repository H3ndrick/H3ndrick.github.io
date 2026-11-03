# Portfólio — Hendrick Araújo Ascendino

Site pessoal estático (HTML, CSS e JavaScript puros), sem dependências nem etapa de build.

## Rodar localmente (WSL)

```bash
cd ~/projetos/portfolio
python3 -m http.server 8000
```

Abra **http://localhost:8000** no navegador do Windows. Para parar o servidor: `Ctrl + C`.

## Estrutura

| Arquivo      | O que contém                                            |
|--------------|---------------------------------------------------------|
| `index.html` | Todo o conteúdo (experiência, projetos, habilidades...) |
| `styles.css` | Visual, cores (tokens em `:root`), tema claro/escuro    |
| `script.js`  | Tema, menu mobile, animações, copiar e-mail             |

Para editar textos, mexa só no `index.html`. Para trocar a cor de destaque, altere `--mark` em `styles.css`.

### Detalhes interativos

- **Quadro CAM-01** (topo): simula uma câmera com detecções e um falso alerta (sombra detectada como pessoa). A ROI-OFF mínima sugerida pode ser aprovada ou descartada, e o visitante pode desenhar as suas; detecções com o centro dentro de uma ROI-OFF são ignoradas. As caixas da cena ficam em `DETECTIONS` e `SUGGESTION` no `script.js`.
- **Modo detecção** (botão ou tecla `D`): desenha bounding boxes com classe e confiança sobre os elementos que têm o atributo `data-det="classe"` no HTML.

### Prints dos projetos (`.shot`)

Cada projeto pode ter um visualizador no estilo "dataset anotado": a linha de varredura passa pela imagem e as caixas aparecem.

1. Salve o print em `img/` (1440×900, de preferência `.webp`).
2. Copie um bloco `<figure class="shot">` do CineBrasil no `index.html`.
3. Para cada caixa, use `<div class="ann" style="--l:X; --t:Y; --w:L; --h:A" data-label="rótulo">`, com valores em **% da imagem** (pixel ÷ 1440 × 100 na horizontal, pixel ÷ 900 × 100 na vertical).

Cada `.shot__item` é um frame; com mais de um, aparecem os botões ◂ ▸.

### Lab: "Anote como eu" (`js/game.js` + `js/iou.js`)

Jogo de anotação: o visitante desenha uma caixa e recebe o IoU com a caixa de referência.

- **Interface e rodadas:** `js/game.js`, feito com apoio de IA. As caixas de referência ficam em `ROUNDS`, em % da imagem.
- **Métrica:** `js/iou.js`, a implementar (TODO). O contrato está documentado no próprio arquivo.
- **Testes:** `node --test tests/`, na raiz do projeto. Precisa do Node: no WSL ele ainda não está instalado; dá para rodar pelo PowerShell do Windows (`cd \\wsl.localhost\Ubuntu\home\hendrick\projetos\portfolio`) ou instalar o Node no WSL via nvm.

Planejamento dos próximos recursos: `docs/PLANEJAMENTO.md`.

## Versões

A primeira versão está salva na tag `v1-backup`, na branch `backup/v1` e em `~/projetos/portfolio-v1-backup/`.
Para ver: `git checkout v1-backup` (volte com `git checkout main`).

## Publicar no GitHub Pages

```bash
gh repo create portfolio --public --source=. --remote=origin --push
gh api -X POST repos/H3ndrick/portfolio/pages -f "source[branch]=main" -f "source[path]=/"
```

O site fica em `https://h3ndrick.github.io/portfolio/`.
Para usar `https://h3ndrick.github.io/`, crie o repositório com o nome `H3ndrick.github.io`.
