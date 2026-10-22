# especificaciones del proyecto

## 1. Funcionamiento general

Una aplicación web interactiva que usa la cámara y el reconocimiento de manos en tiempo real.

Flujo principal:

1. El usuario abre la mano(s) frente a la cámara.
2. Aparece una mariposa brillante en pantalla.
3. Al mover la mano, la mariposa aletea y se desplaza hacia la dirección de la mano.
4. Si la mano se desplaza hacia un lado (movimiento lateral), la mariposa "llueve" un sistema de partículas en forma de flores.
5. Al activarse la lluvia de flores, suena una melodía de piano durante 10 segundos.
6. Al cerrar la mano(s), la mariposa desaparece y la aplicación vuelve al estado inicial.

## 2. Tecnología y stack

- **Visual y sonido base:** p5.js + p5.Sound
- **Detección de manos:** frame differencing (diferencia de frames de video con p5.js), sin librería de IA externa
- **Lenguaje:** JavaScript (vanilla, dentro del entorno p5)
- **HTML/CSS:** página mínima con contenedor del canvas de p5.js

Decisión tomada: se usa **`p5.Sound`** para la melodía de piano (ya viene con p5.js, sin librería extra).

## 3. Entrada: cámara y detección de movimiento

- Cámara web activada al cargar la aplicación.
- Video de entrada **espejado** (mirrored) para que el movimiento de la mano coincida con lo que el usuario ve en pantalla.
- Resolución: 640 × 480.
- Detección: **frame differencing** — se compara el frame actual con el anterior para detectar movimiento de píxeles. No requiere modelo de IA ni ml5.js.
- Umbrales definidos:
  - `MOTION_THRESHOLD`: diferencia mínima de píxeles para considerar movimiento (25).
  - `MOTION_AREA_MIN`: área mínima de movimiento para considerar mano presente (800 px).
  - `MOTION_AREA_OPEN`: área mínima para considerar mano abierta (2500 px).

## 4. Estados de la aplicación (máquina de estados)

La aplicación se rige por estados claros:

| Estado | Qué se ve | Qué dispara la transición |
|--------|-----------|---------------------------|
| `IDLE` | Nada (o fondo vacío) | Mano(s) abierta(s) → `MANOS_ABIERTAS` |
| `MANOS_ABIERTAS` | Mariposa brillante quieta | Movimiento de la mano → `MOVIENDOSE` |
| `MOVIENDOSE` | Mariposa aleteando hacia la mano | Movimiento lateral supera umbral → `LLUVIA` |
| `LLUVIA` | Mariposa + partículas de flores + piano | Cierra la mano → `IDLE` |
| `IDLE` (retorno) | Mariposa y partículas desaparecen | — |

## 5. Mariposa

- **Apariencia:** imagen PNG con fondo transparente, cargada desde `assets/images/` (ruta exacta por definir).
- **Efecto brillante:** brillo simulado con gradiente, halo o `strokeWeight` dinámico alrededor de las alas.
- **Comportamiento:**
  - Aparece cuando se detectan mano(s) abierta(s).
  - Aletea (cambia la apertura de alas) cuando la mano se mueve.
  - Se desplaza hacia la posición actual de la mano detectada.
  - Desaparece al cerrar la mano.

## 6. Sistema de partículas de flores

- **Disparador:** movimiento lateral de la mano en el eje X que supere un umbral de píxeles por frame (valor por definir, ej. 10–20 px/frame).
- **Partículas:** forma de flor (pétalos simples con `ellipse` o `beginShape`), colores pastel o definidos por el usuario.
- **Cantidad:** número de partículas por activación (por definir, ej. 30–60).
- **Movimiento:** caen desde la posición de la mariposa hacia abajo con ligera dispersión horizontal.
- **Vida:** cada partícula desaparece tras cierto tiempo o al salir del canvas.

## 7. Sonido: melodía de piano

- **Duración:** 10 segundos por activación.
- **Fuente de sonido:** `p5.Sound` (ya incluido en p5.js) o **Tone.js** (por definir — ver decisión pendiente en sección 2).
- **Contenido:** secuencia de notas de piano (melodía simple o acordes). ¿Fija o generada al azar? (por definir).
- **Reactivación:** si el usuario dispara la lluvia de nuevo antes de que terminen los 10 segundos, ¿se reinicia la melodía o se superpone? (por definir).

## 8. Estructura de archivos

```
proyectonuevo/
├── index.html
├── sketch.js          # lógica principal de p5.js
├── libs/              # librerías (p5, ml5, opcional Tone.js)
└── assets/
    ├── images/        # mariposa PNG (opcional), flores
    └── sounds/        # samples de piano (si se usa p5.Sound)
```

## 9. Flujo de interacción paso a paso (checklist de implementación)

1. Configurar `index.html` con las etiquetas `<script>` de p5.js y ml5.js.
2. Crear el canvas de p5.js y ocultar el video de la cámara (mostrar solo el resultado procesado).
3. Inicializar el modelo `handPose` de ml5 y comenzar la detección.
4. Implementar la máquina de estados (`IDLE`, `MANOS_ABIERTAS`, `MOVIENDOSE`, `LLUVIA`).
5. Dibujar la mariposa brillante y hacerla seguir la mano detectada.
6. Animar el aleteo de la mariposa proporcional al movimiento de la mano.
7. Detectar movimiento lateral en X y disparar partículas de flores.
8. Reproducir melodía de piano durante 10 segundos al activar la lluvia.
9. Limpiar partículas y detener el piano al cerrar la mano y volver a `IDLE`.
10. Ajustar umbrales, colores y timing hasta que la interacción se sienta fluida.

## 10. Criterios de aceptación (checklist)

- [ ] La cámara se inicia y el video está espejado.
- [ ] Al abrir la mano(s), aparece la mariposa brillante.
- [ ] Al mover la mano, la mariposa se desplaza hacia ella y aletea.
- [ ] Al mover la mano hacia un lado con suficiente velocidad, aparecen partículas de flores.
- [ ] Al activar las partículas, suena piano durante 10 segundos.
- [ ] Al cerrar la mano, todo desaparece y vuelve al estado inicial.
- [ ] El código corre en el navegador sin errores de consola.

## 11. Decisiones tomadas y pendientes

**Tomadas:**
- Una mano para disparar la aparición de la mariposa.
- `p5.Sound` para la melodía de piano (ya viene con p5.js, sin librería extra).
- Imagen PNG con fondo transparente para la mariposa (asset en `assets/images/`, ruta por definir).
- Umbral de movimiento lateral: **15 px/frame** para disparar la lluvia de flores.
- **40 partículas de flores**, de color **naranja y amarillo**.
- Melodía de piano con **notas al azar**.
- **Se reinicia el piano** si se dispara la lluvia otra vez antes de los 10 segundos.
- Detección de manos por **frame differencing** (sin ml5 ni modelo de IA externo).

**Todas las decisiones están definidas.**
