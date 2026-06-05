# Nueva Clase de Personaje — Guía de Integración

## Estructura real del blueprint (64×64)

El personaje ocupa **~50px de alto × ~25-40px de ancho**, centrado en el canvas 64×64.
La zona de dibujo efectiva: **filas 9-58, cols ~12-52** (varía por clase).

### Distribución anatómica aproximada (coordenadas reales)
```
Filas  9-20: Cabeza + casco/capucha (casco ~12px ancho)
Filas 15-20: Cara (ojos en ~filas 16-17)
Filas 21-22: Cuello / transición
Filas 22-35: Torso + hombros (hombros anchos ~cols 10-52)
Filas 23-30: Brazos (col 12-18 izq, col 44-52 der)
Filas 30-42: Cintura + pelvis + arma/escudo
Filas 42-58: Piernas y pies
```

### Ejemplo: fighter (referencia de estilo)
```
Paleta: A=#000000 B=#567194 C=#3a4e69 D=#253347 E=#ffdbac F=#bdc3c7 G=#e4e7ec H=#7f8c8d I=#ffffff J=#5d4037

Filas 9-20 (cabeza, zona cols 18-38):
09:           AAAAAA
10:          ABBBBBBAA
11:         ABBBBBBBBBA
12:        ABBBBBBBBBCDA
13:        ABBBBBBBBCCDA
14:        ABBBAAAAAAADA
15:        ABBBEEEEEEEDA    ← E = piel, clave para customización
16:        ABBBEEAEEAEDA    ← A = ojos (píxeles negros)
17:        ABBBEEAEEAEDA
18:        ABBBEEEEEEEDA
19:        ABBBBBCCCCCDA
20:        ABBBBBCCCCCDA
```

---

## Paso a paso: añadir una nueva clase

### PASO 1 — Definir la paleta (máx. 12 claves)

**Plantilla de paleta estándar:**
```json
{
  " ": "transparent",
  "A": "#000000",     ← SIEMPRE negro para contorno
  "B": "[color_primario_clase]",   ← armadura/ropa principal
  "C": "[color_primario_oscuro]",  ← sombra del primario (30% más oscuro)
  "D": "[color_primario_profundo]", ← sombra profunda (50% más oscuro)
  "E": "#ffdbac",     ← SIEMPRE piel base (no cambiar este HEX, se sobreescribe en runtime)
  "F": "[complementario_claro]",   ← segundo material claro
  "G": "[complementario_highlight]", ← highlight segundo material
  "H": "[complementario_oscuro]",  ← sombra segundo material
  "I": "#ffffff",     ← blanco puro (highlights extremos, ojos blancos)
  "J": "#5d4037"      ← madera/cuero (armas, cinturón — reusar en todas las clases)
}
```

### PASO 2 — Diseñar en ASCII (formato simplificado 32×32)

Antes de hacer el blueprint 64×64, dibuja en 32×32 para validar el diseño:
```
Leyenda: A=negro B=color_clase C=sombra E=piel F=material . =vacío

...........AAAA...........  ← casco/cabeza
..........ABBBBA..........
.........ABBBBBBA.........
.........ABBBBBBA.........
.........ABEEEEBA.........  ← cara (E = piel)
.........ABEA.AEBA........  ← ojos (A sobre E)
.........ABEEEEEBA........
.........ABBBBBBBA........  ← barbilla/cuello
........AFFBBBBBBFFA......  ← hombros (F = hombrera)
.......AFFBBBBBBBBFFA.....
......AFFGBBBBBBBBGFFA....
......AFFBBBBBBBBBBFFA....
......AFFBBBBBBBBBBFFA....
......AFFBBBBCCCCCFFA.....
......AFFBBBBCCCCCFFA.....
.......AFJJJJJJJJJJA......  ← cinturón (J = cuero)
.......ABBBBBBBBBBBA......
......ABBBBBBAABBBBBA.....  ← piernas separadas
.....ABBBBBBAAABBBBBBA....
....ABBBBBBAAAAABBBBBA....
....ABBBBBBAAAABBBBBA.....
.....AAAAAA.....AAAAA.....
```

### PASO 3 — Blueprint 64×64 completo

El blueprint es un array JSON de 64 strings, cada string de 64 caracteres.

**Método de generación:**
1. Escala el diseño 32×32 a 64×64 (duplica cada píxel horizontal y verticalmente)
2. Añade detalles adicionales aprovechando la resolución mayor
3. Centra en el canvas: padding horizontal de ~12px a cada lado

**Script de ayuda (Python) para escalar un diseño:**
```python
# Dado un diseño 32×32 como lista de strings, escala a 64×64
def scale_blueprint(design_32):
    result = []
    for row in design_32:
        doubled_row = ''.join(c * 2 for c in row.ljust(32))
        result.append(doubled_row)
        result.append(doubled_row)  # duplicar la fila
    return result

# Rellenar hasta 64 filas y 64 cols con espacios si faltan
def pad_blueprint(bp_64):
    padded = []
    for row in bp_64:
        padded.append(row.ljust(64)[:64])
    while len(padded) < 64:
        padded.append(' ' * 64)
    return padded
```

### PASO 4 — Insertar en character_blueprints.json

```json
{
  "fighter": { ... },
  "paladin": { ... },
  // ... clases existentes ...
  "NUEVA_CLASE": {
    "paleta": {
      " ": "transparent",
      "A": "#000000",
      "B": "#HEX_PRIMARIO",
      "C": "#HEX_SOMBRA",
      "D": "#HEX_PROFUNDO",
      "E": "#ffdbac",
      "F": "#HEX_COMP_CLARO",
      "G": "#HEX_COMP_HIGHLIGHT",
      "H": "#HEX_COMP_OSCURO",
      "I": "#ffffff",
      "J": "#5d4037"
    },
    "blueprint": [
      "                                                                ",
      // ... 62 filas más ...
      "                                                                "
    ]
  }
}
```

### PASO 5 — Actualizar TYPE_MAP en ModernPixelAvatar.jsx

```js
// En src/components/common/ModernPixelAvatar.jsx
const TYPE_MAP = {
  // ... existentes ...
  'nueva_clase': 'nueva_clase',  // ← añadir aquí
  // Si es un alias de otra clase:
  'nombre_alternativo': 'nueva_clase',
};
```

### PASO 6 — Añadir a CharacterCreation.jsx

Buscar donde se listan las clases disponibles al crear personaje y añadir la nueva con:
- `id`: clave en TYPE_MAP
- `name`: nombre visible
- `description`: descripción breve del rol RPG
- `stats`: distribución de stats base (str, dex, int, con, cha)

---

## Paletas de referencia por arquetipo

### Arquetipo Guerrero (físico, metal)
```
B: #567194 (azul acero), C: #3a4e69, D: #253347
F: #bdc3c7 (plata), G: #e4e7ec, H: #7f8c8d
```

### Arquetipo Mago (arcano, tela)
```
B: #8a2be2 (violeta), C: #4f1c78, D: #2d0a4a
F: #09eeff (cyan mágico), G: #d395e9, H: #501c78
```

### Arquetipo Naturaleza (druida, ranger)
```
B: #27ae60 (verde), C: #1e8449, D: #145a32
F: #8b5e3c (cuero), G: #a0814d, H: #5d3a1e
```

### Arquetipo Oscuro (necromancer, antipaladin)
```
B: #2c3e50 (gris oscuro), C: #1a252f, D: #0d1318
F: #8e44ad (púrpura oscuro), G: #9b59b6, H: #6c3483
```

### Arquetipo Sagrado (cleric, paladin dorado)
```
B: #f1c40f (dorado), C: #f39c12, D: #e67e22
F: #ffffff (blanco), G: #ecf0f1, H: #bdc3c7
```

### Arquetipo Pícaro (cuero, sombras)
```
B: #5d4037 (cuero oscuro), C: #301b03, D: #1a0d00
F: #27ae60 (detalles verdes), G: #2ecc71, H: #1e8449
```
