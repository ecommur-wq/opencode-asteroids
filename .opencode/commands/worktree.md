---
description: Crea un git worktree en .worktrees/<nombre>
agent: build
---

Crea un worktree de git llamado `$ARGUMENTS` en `.worktrees/` de este repo.

Worktrees existentes:
!`git worktree list`

Rama actual (base del nuevo worktree):
!`git branch --show-current`

Pasos:

1. Valida `$ARGUMENTS`: un solo identificador con letras, dígitos, `-` y `_`. Sin espacios, sin `/`, sin `..`, sin flags que empiecen por `-`. Si no es válido, no ejecutes nada: explica por qué y pide un nombre válido.
2. Si `.worktrees/<nombre>` ya existe o `git worktree list` ya muestra un worktree con ese nombre o esa ruta, no lo sobrescribas ni lo fuerces: avisa y termina.
3. Ejecuta exactamente `git worktree add .worktrees/<nombre>` (sin `-b`: git crea la rama `<nombre>` desde HEAD).
4. Informa en español: ruta del worktree, rama creada, y cómo entrar (`cd .worktrees/<nombre>` o `opencode .worktrees/<nombre>` para una sesión nueva).

No hagas commits, no toques `.gitignore` (`.worktrees/` ya está ignorado) y no crees archivos dentro del worktree nuevo.