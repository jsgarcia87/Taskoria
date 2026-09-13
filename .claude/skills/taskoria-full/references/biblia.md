# 📜 LA BIBLIA DE TASKORIA — fuente de verdad narrativa

> Todo nuevo asset, diálogo, misión o pantalla debe ser coherente con este documento. Si algo lo
> contradice, este documento gana — o se actualiza a propósito, nunca por accidente.
> Convención: cada sistema real de software tiene una **capa técnica** (lo que hace el código) y una
> **capa narrativa** (cómo lo vive el jugador). Nunca se mezclan de cara al usuario: el jugador jamás
> ve "error 500", ve una "grieta del Archivo".

## 1. Premisa y cosmología
**El Archivo:** biblioteca infinita fuera del tiempo que registra cada intención, promesa y tarea sin
terminar de cualquier ser consciente. No crea las tareas — las *recibe*: una intención real cae al
Archivo como semilla y se materializa en Taskoria como **misión**. Taskoria es el reino construido con
la materia prima de las intenciones cumplidas: cada tarea completada es un ladrillo real; cada tarea
abandonada es una grieta, una ruina, un monstruo.

**El Héroe y el Ancla:** cada jugador es un Héroe del Archivo, un alma proyectada desde el mundo real a
través del **Ancla**, que sincroniza su vida real con el avatar. **Regla de oro:** el juego nunca miente
sobre el mundo real — no hay recompensas por tareas no hechas, ni experiencia regalada.

**Por qué hay mazmorras:** el Archivo materializa también la *resistencia* (procrastinación, miedo,
cansancio), que se condensa en criaturas y ruinas. Vencer un monstruo en un Focus Dungeon = vencer la
procrastinación de una sesión de trabajo real.

## 2. Geografía — los cinco dominios
- **Town Square** (`townSquare`, tile `cobblestone_warm`) — La Plaza del Archivo: corazón cívico,
  mercado, sede pública del Consejo, tablones (feed social). Primera zona del Héroe nuevo.
- **Taskoria Keep** (`taskoriaKeep`) — La Fortaleza: progresión alta (ficha, atributos, evolución de
  clase). Trono vacío = el Héroe; el Archivo lo construye a su medida real.
- **Tavern Interior** (`tavernInterior`) — La Posada del Descanso: recuperación/autocuidado; el Héroe no
  lucha. Puerta de entrada a mazmorras.
- **Mystic Forest** (`mysticForest`) — El Bosque de la Constancia: rachas y hábitos; crece con la
  constancia, se marchita con el descuido.
- **Shadow Crypts** (`shadowCrypts`) — Las Criptas de lo Pendiente: tareas atrasadas/evitadas; cuanto
  más lleva pendiente una tarea real, más profunda su cripta.
- **Fuera del mapa:** **Wild Sanctuary** (mascotas descansan; cuidado, no combate) y **Family Estate**
  (vínculo entre Héroes reales emparentados — "el linaje del Héroe").

## 3. Los Guardianes (quienes guían al Héroe) + el Consejo
Seis Guardianes con arte final 64×64. Ningún evento técnico se muestra en crudo: pasa por la voz del
Guardián/NPC que corresponda.

| Guardián · Título | Función | Cita | Voz |
|---|---|---|---|
| **Cartograph** · The Explorer | Navegación / mundo abierto | "The lands stretch far. Where will your party wander today?" | Inquieto; direcciones y distancias. |
| **Chronos** · The Timekeeper | Tiempo / Pomodoro / ciclo día-noche | "Time is a monster. Slay it, or let it consume you." | Solemne; mide las palabras. |
| **Ledgar** · The Chronicler | Hábitos + Tareas + Diario (y registro de incidencias) | "I record every deed, lest they fade into the void." | Burocrático-amable. |
| **Notifus** · The Herald | Notificaciones/recordatorios **+** convocar party & guilds | "Bonds of fellowship forge the strongest armor." | Marcial y teatral, el más ruidoso a propósito. |
| **Patchsmith** · The Forgemaster | Pixel Studio colaborativo + dev/parches | "Give me the blueprints, and we shall build this world together." | Herrero entusiasta, humor de taller. |
| **Matriarch** · The Protector | Multi-perfil familias + protección de datos | "Every lineage has its heroes. Let them all rise." | Materna pero inflexible. |

**Canon de convivencia (RESUELTO):** el **Consejo del Archivo** (NPCs interactivos: Ledgar, **Sysmara**
—monitorización, Patchsmith, Notifus, **Coinhilda** —tienda/economía, **Onboardin** —onboarding) y el
**Salón de los Guardianes** (las seis estatuas conmemorativas) **coexisten**. Ledgar/Notifus/Patchsmith
tienen doble representación (NPC + estatua); Sysmara/Coinhilda/Onboardin siguen vigentes como NPCs sin
estatua; Cartograph/Chronos/Matriarch son miembros nuevos. En `MapData.js`, documentar por separado la
ubicación de cada estatua y la de cada NPC vivo.

Voces de los NPCs solo-Consejo: **Sysmara** ("Lo vi temblar antes de que cayera. Por eso estoy aquí."),
**Coinhilda** ("El oro del Archivo se gana con hazañas, no se regala."), **Onboardin** ("No hace falta
que sepas quién eres todavía. El Archivo te lo irá mostrando.").

### Glosario técnico ↔ narrativo
Bug → Grieta del Archivo · Downtime → Eclipse temporal · Deploy → Nueva forja · Push → Campanada de
Notifus · Compra → Ofrenda a la Bóveda · Pomodoro → Expedición de enfoque · Racha rota → Grieta en el Bosque.

## 4. Las catorce clases (arquetipos de cómo se aborda una tarea)
Fighter (el constante) · Paladin (el comprometido, cumple por honor) · Wizard (el planificador) · Rogue
(el eficiente, atajo legítimo) · Cleric (sanador de rachas) · Ranger (organizado a largo plazo) ·
Barbarian (arranques intensos) · Bard (el social/coworking) · Druid (hábitos por ciclos) · Monk (el
disciplinado, repetición) · Necromancer (revive tareas muertas) · Antipaladin (rompe reglas propias
para cumplir) · Sorcerer (impulsivo con talento) · Scout (explorador de features nuevas).
Blueprints 64×64; clave de paleta `E` = piel (recolor en runtime); render vía `ModernPixelAvatar`.

## 5. Bestiario
**El Huevo Místico:** un solo diseño para todos (cascarón hueso pálido con vetas doradas). Incuba **solo**
completando **sesiones de foco reales** (Pomodoro); las abandonadas no cuentan. La especie la inclina la
**eficacia real** del Héroe (constancia, sesiones completas, racha) — fórmula desconocida a propósito, no
se puede min-maxear. Cuatro leyendas contradictorias adrede (Reflejo del Archivo, Apuesta de Coinhilda,
Cuento de cuna de Onboardin, Entrada Sellada de Ledgar). El **Fénix** no nace del Huevo: elige a su Héroe
tras recuperar una racha rota.

Catálogo (7 especies): **Slime** (base, sin evolución aún) · **Wolf → Arctic Alpha** (+5% DMG) · **Lion →
Desert Sovereign** (+5% resist) · **Emberwyrm** (Wyrmling→adulto; occidental alado; +8% DMG físico) ·
**Frostcoil** (Coilling→adulto; oriental serpentino; +5 INT / +10% regen foco) · **Tidewyrm**
(Hatchling→adulto; occidental de agua; +8% regen foco / +5 stamina) · **Phoenix** (renacimiento; perk
acumulativo por resiliencia). Montura aparte: **Griffin** (`mountSpecies.js`). Nota: Jesús dibuja a mano
mascotas/monturas/Guardianes; no generar su pixel art salvo petición explícita.

**Amenazas** (capa narrativa; sprites de producción en el worldbuilder): Espectros de la Procrastinación
(menores, numerosos), Guardianes Oxidados (hábitos descuidados; lentos pero fuertes), Shadow Mage (la
distracción; ataca la concentración), Boss Semanal (encarnación del proyecto grande; HP ligado al
esfuerzo real acumulado).

## 6. Sistemas narrados
- **Focus Dungeons (Pomodoro):** cada sesión = expedición; terminar = derrotar al enemigo + loot; pausar
  = retirada táctica; abandonar = mazmorra sin conquistar (sin castigo cruel, solo sin recompensa).
- **Quest Log:** misiones activas (contratos abiertos) + diarias (juramento del día). Barra 0% = 0% real.
- **Hero Profile:** STR/DEX/INT/CON/WILL/CHA se alimentan del tipo de tareas reales — espejo honesto.
- **Family Estate / retos:** competencia sana de constancia, no combate literal.
- **Sanctuary:** enviar una mascota a descansar = el jugador también necesita parar (cuidado, no abandono).

## 7. Heráldica (Heraldry Builder v2)
Sistema propio para gremios/familias/guilds. Diestro/siniestro desde el portador; pieles y `proper`
exentas de contraste; líneas (engrailed, invected, wavy, indented, dancetty, embattled); ordinarios
(chevron, pile, pall, canton, bend sinister…); cuatro posturas de león; blasón en terminología heráldica
española correcta.

## 8. Reglas de escritura para contenido nuevo
1. Nunca mentir sobre el mundo real. 2. Sin clichés motivacionales ni lenguaje "guru". 3. La fricción es
parte de la historia, no un fallo a esconder. 4. Todo evento técnico pasa por un NPC del Consejo/Guardián.
5. Cada Guardián/NPC tiene voz distinta y consistente — releer su cita antes de escribir diálogo nuevo.
