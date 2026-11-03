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

- **Quadro CAM-01** (topo): arraste para desenhar ROIs; caixas abaixo do mínimo (`MIN` em `script.js`) são rejeitadas.
- **Modo detecção** (botão ou tecla `D`): desenha bounding boxes com classe e confiança sobre os elementos que têm o atributo `data-det="classe"` no HTML.

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
