#!/bin/bash
# ============================================================
# Taskoria Skill — Instalador para Claude Code CLI
# Uso: chmod +x install.sh && ./install.sh
# ============================================================

set -e

SKILL_NAME="taskoria"
SKILL_DIR="$HOME/.claude/skills/$SKILL_NAME"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo ""
echo "⚔  Taskoria Skill — Instalador para Claude Code"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Comprobar que Claude Code está instalado
if ! command -v claude &> /dev/null; then
    echo "❌  Claude Code CLI no encontrado."
    echo "    Instálalo con: npm install -g @anthropic-ai/claude-code"
    exit 1
fi

echo "✓  Claude Code detectado: $(claude --version 2>/dev/null || echo 'versión desconocida')"

# Crear directorio de skills si no existe
mkdir -p "$HOME/.claude/skills"

# Backup si ya existe el skill
if [ -d "$SKILL_DIR" ]; then
    BACKUP="${SKILL_DIR}.backup.$(date +%s)"
    echo "⚠  Ya existe ~/.claude/skills/$SKILL_NAME"
    echo "   Haciendo backup en $BACKUP"
    mv "$SKILL_DIR" "$BACKUP"
fi

# Copiar el skill
cp -r "$SCRIPT_DIR" "$SKILL_DIR"
# Eliminar el propio script del destino para no incluirlo
rm -f "$SKILL_DIR/scripts/install.sh"

echo ""
echo "✅  Skill instalado en: $SKILL_DIR"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋  CÓMO USARLO:"
echo ""
echo "  Opción A — Invocación directa:"
echo "    Dentro de Claude Code: /taskoria"
echo ""
echo "  Opción B — Detección automática:"
echo "    Describe tu tarea y Claude cargará el skill:"
echo "    'Añade un tile de hierba al mysticForest'"
echo "    'Crea una nueva clase de personaje: samurai'"
echo "    'Mejora el Wild Sanctuary'"
echo ""
echo "  Verificar instalación:"
echo "    En Claude Code: '¿Qué skills tienes disponibles?'"
echo "    O: /doctor"
echo ""
echo "  Para instalación de PROYECTO (solo este repo):"
echo "    cp -r $SCRIPT_DIR .claude/skills/taskoria"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
