---
description: Elimina un git worktree de .worktrees/<nombre> y borra su rama
agent: build
---

Elimina el worktree de git llamado `$1` en `.worktrees/` de este repo y borra su rama `$1`.

Worktrees existentes:
!`git worktree list`

Rama actual (base para comparar commits):
!`git branch --show-current`

Pasos:

1. Si `$1` está vacío, no ejecutes nada: pide un nombre.
2. Valida `$1`: un solo identificador con letras, dígitos, `-` y `_`. Sin espacios, sin `/`, sin `..`, sin flags que empiecen por `-`. Si no es válido, no ejecutes nada: explica por qué y pide un nombre válido.
3. Si `.worktrees/<nombre>` no existe y `git worktree list` no lo muestra, no inventes nada: avisa de que no hay tal worktree y termina.
4. Si el worktree tiene cambios sin commitear (`git -C .worktrees/<nombre> status --porcelain` devuelve algo), no lo borres y no añadas `--force`: informa de los cambios pendientes y termina.
5. Ejecuta `git log --oneline <rama-base>..<nombre>`. Si devuelve commits, no borres la rama todavía: muéstralos y pide confirmación explícita.
6. Ejecuta exactamente, en este orden y sin flags extra:
   - `git worktree remove .worktrees/<nombre>`
   - `git branch -D <nombre>`
   Si `git worktree remove` falla, informa del error y para: nunca lo reintentes con `--force`.
7. Informa en español: ruta eliminada, rama borrada, y verifica con `git worktree list` y `git branch --list <nombre>`.

No hagas commits, no toques `.gitignore` (`.worktrees/` ya está ignorado) y no crees archivos dentro del worktree que se borra.