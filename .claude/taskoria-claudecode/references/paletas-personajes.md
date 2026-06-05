# Paletas de Personajes Existentes — Taskoria

Referencia completa extraída de character_blueprints.json.
Usar para mantener coherencia visual al crear nuevas clases.

---

## Paletas Completas

### fighter (Guerrero)
```
" "=transparent  A=#000000  B=#567194  C=#3a4e69  D=#253347
E=#ffdbac  F=#bdc3c7  G=#e4e7ec  H=#7f8c8d  I=#ffffff  J=#5d4037
Estilo: Armadura de metal azul-gris, piel caucásica, espada madera
```

### paladin (Paladín)
```
" "=transparent  A=#000000  B=#f1c40f  C=#f39c12  D=#e67e22
E=#ffdbac  F=#ffffff  G=#ecf0f1  H=#bdc3c7  I=#ffffff  J=#5d4037
Estilo: Armadura dorada brillante, blanco sagrado, luz divina
```

### wizard (Mago)
```
" "=transparent  A=#000000  B=#8a2be2  C=#4f1c78  D=#ffffff
E=#5d4037  F=#ffdbac  G=#09eeff  H=#9969ab  I=#d395e9  J=#05eeff  K=#501c78
(nota: E y F intercambian roles — E=cuero, F=piel en este diseño)
Estilo: Túnica violeta, detalles cyan mágico, orbe brillante
```

### rogue (Pícaro)
```
" "=transparent  A=#000000  B=#5d4037  C=#301b03  D=#ffdbac
E=#eeb677  F=#efb677  G=#355f02  H=#274106  I=#355f03  J=#000402  K=#011e0c
Estilo: Cuero oscuro, verde bosque, sigilo
```

### cleric (Clérigo)
```
" "=transparent  A=#000000  B=#ffffff  C=#f1c40f  D=#ffffff
E=#5d4037  F=#ffdbac  G=#09eeff  H=#ecf0f1  I=#bdc3c7  J=#05eeff  K=#f39c12
Estilo: Toga blanca, detalles dorados y sagrados, bastón mágico
```

### ranger (Explorador)
```
" "=transparent  A=#000000  B=#5d4037  C=#301b03  D=#ffdbac
E=#eeb677  F=#efb677  G=#27ae60  H=#1e8449  I=#145a32  J=#000402  K=#011e0c
Estilo: Cuero, verde naturaleza, arco de madera
```

### barbarian (Bárbaro)
```
" "=transparent  A=#000000  B=#cb4335  C=#a93226  D=#7b241c
E=#ffdbac  F=#ffdbac  G=#e5c298  H=#c2a37f  I=#ffffff  J=#5d4037
Estilo: Piel al descubierto, rojo berserker, piel tostada, furia
```

### bard (Bardo)
```
" "=transparent  A=#000000  B=#f1c40f  C=#301b03  D=#ffdbac
E=#eeb677  F=#efb677  G=#9b59b6  H=#8e44ad  I=#e67e22  J=#000402  K=#011e0c
Estilo: Colorido, violeta + dorado, laúd, sombrero con pluma
```

### druid (Druida)
```
" "=transparent  A=#000000  B=#27ae60  C=#1e8449  D=#ffffff
E=#5d4037  F=#ffdbac  G=#2ecc71  H=#8e44ad  I=#58d68d  J=#2ecc71  K=#145a32
Estilo: Verde naturaleza, madera, aura mágica verde, totem animal
```

### monk (Monje)
```
" "=transparent  A=#000000  B=#5d4037  C=#301b03  D=#ffdbac
E=#f1c40f  F=#efb677  G=#e67e22  H=#d35400  I=#f1c40f  J=#000402  K=#011e0c
Estilo: Ropa holgada, dorado espiritual, manos desnudas, kung-fu
```

### necromancer (Nigromante)
```
" "=transparent  A=#000000  B=#2c3e50  C=#1a252f  D=#ffffff
E=#5d4037  F=#ffdbac  G=#8e44ad  H=#8e44ad  I=#9b59b6  J=#9b59b6  K=#1abc9c
Estilo: Negro profundo, aura púrpura oscura, detalles verde tóxico
```

### antipaladin (Antipaladín)
```
" "=transparent  A=#000000  B=#2c3e50  C=#1a252f  D=#11151c
E=#ffdbac  F=#c0392b  G=#e74c3c  H=#922b21  I=#ffffff  J=#5d4037
Estilo: Armadura negra, sangre roja, sombras profundas, evil
```

### sorcerer (Hechicero)
```
" "=transparent  A=#000000  B=#c0392b  C=#922b21  D=#ffffff
E=#5d4037  F=#ffdbac  G=#f1c40f  H=#e67e22  I=#f39c12  J=#f39c12  K=#d35400
Estilo: Rojo fuego, llamas doradas, innato poder caótico
```

### scout (Explorador ligero)
```
" "=transparent  A=#000000  B=#8d6e63  C=#301b03  D=#ffdbac
E=#eeb677  F=#efb677  G=#7cb342  H=#558b2f  I=#33691e  J=#000402  K=#011e0c
Estilo: Marrón cálido, verde oliva, ágil y rápido
```

---

## Análisis de patrones de color por arquetipo

### Patrones de armadura/ropa (B, C, D)
| Arquetipo | B (base) | C (sombra) | D (profundo) |
|-----------|----------|------------|--------------|
| Metal azul | #567194 | #3a4e69 | #253347 |
| Metal dorado | #f1c40f | #f39c12 | #e67e22 |
| Oscuro/Evil | #2c3e50 | #1a252f | #11151c |
| Rojo fuego | #c0392b | #922b21 | #6e1b15 |
| Rojo berserker | #cb4335 | #a93226 | #7b241c |
| Verde naturaleza | #27ae60 | #1e8449 | #145a32 |
| Verde oliva | #7cb342 | #558b2f | #33691e |
| Violeta mágico | #8a2be2 | #4f1c78 | #2d0a4a |
| Morado bardo | #9b59b6 | #8e44ad | #6c3483 |
| Cuero clásico | #5d4037 | #301b03 | #1a0d00 |
| Cuero cálido | #8d6e63 | #5d4037 | #301b03 |
| Blanco sagrado | #ffffff | #ecf0f1 | #bdc3c7 |

### Materiales complementarios (F, G, H)
| Material | F (claro) | G (highlight) | H (oscuro) |
|----------|-----------|---------------|------------|
| Plata/Acero | #bdc3c7 | #e4e7ec | #7f8c8d |
| Tela blanca | #ffffff | #ecf0f1 | #bdc3c7 |
| Magia cyan | #09eeff | #d395e9 | #501c78 |
| Aura verde | #2ecc71 | #58d68d | #1e8449 |
| Aura púrpura | #8e44ad | #9b59b6 | #6c3483 |
| Llama dorada | #f1c40f | #f39c12 | #e67e22 |
| Piel bronceada | #e5c298 | #ffdbac | #c2a37f |

### Color de piel (E)
Todos los personajes usan `#ffdbac` como piel base en la clave `E`.
En wizard y cleric las claves E/F están invertidas (E=cuero, F=piel) — **evitar este patrón en clases nuevas** para mantener coherencia.

---

## Paletas sugeridas para clases no existentes

### Samurái / Kensei
```
B: #8b0000 (rojo lacado)  C: #5c0000  D: #2d0000
F: #f5f5f5 (ki blanco)    G: #ffffff   H: #cccccc
Contraste: armadura rojo oscuro, detalles plateados o dorados
```

### Psíquico / Mentalist
```
B: #4169e1 (azul real)   C: #2a4a9e  D: #1a2f6b
F: #e0b0ff (lila mental) G: #f5e6ff  H: #b060d0
Contraste: azul profundo, aura lila suave
```

### Alquimista
```
B: #b8860b (bronce)      C: #8b6914  D: #5a440c
F: #7fff00 (verde ácido) G: #adff2f  H: #32cd32
Contraste: bronce/cobre + detalles tóxico verde
```

### Vampiro / Blood Mage
```
B: #1a0000 (negro rojizo) C: #0d0000  D: #060000
F: #8b0000 (sangre)       G: #cc0000  H: #660000
Contraste: extremadamente oscuro, detalles de sangre brillante
```

### Herrero / Forgemaster
```
B: #434343 (gris forja)   C: #2a2a2a  D: #141414
F: #ff6600 (fuego forja)  G: #ff9900  H: #cc4400
Contraste: gris oscuro + naranja fuego incandescente
```
