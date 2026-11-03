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

Para editar textos, mexa só no `index.html`. Para trocar a cor principal, altere `--accent` em `styles.css`.

## Publicar no GitHub Pages

```bash
gh repo create portfolio --public --source=. --remote=origin --push
gh api -X POST repos/H3ndrick/portfolio/pages -f "source[branch]=main" -f "source[path]=/"
```

O site fica em `https://h3ndrick.github.io/portfolio/`.
Para usar `https://h3ndrick.github.io/`, crie o repositório com o nome `H3ndrick.github.io`.
