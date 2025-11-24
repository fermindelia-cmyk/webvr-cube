# Controles del Juego WebVR Cube

## 🖥️ Controles en PC

### Agarrar y Lanzar
- **Spacebar** (Barra espaciadora) o **Click izquierdo del ratón** - Mantén presionado para agarrar el cilindro

### Dirección del Tiro
- **Mouse X (Movimiento Horizontal)**: Controla la dirección del tiro
  - Izquierda → Tiro hacia la izquierda
  - Derecha → Tiro hacia la derecha
  - El cilindro se moverá en un arco mostrando la dirección

### Fuerza del Tiro
- **Mouse Y (Movimiento Vertical)**: Controla la potencia del lanzamiento
  - Arriba (Top) → Mayor fuerza (hasta 20 unidades)
  - Abajo (Bottom) → Menor fuerza
  - El cilindro se levanta cuando lo agarras, indicando que está listo

### Cómo Jugar en PC
1. Mueve el ratón para posicionar el cilindro (dirección + fuerza)
2. Mantén **Spacebar** o presiona **botón izquierdo del ratón**
3. Suelta para lanzar el cilindro
4. El cilindro volará en la dirección y con la fuerza indicadas
5. Girará automáticamente (spin) basado en la potencia

---

## 🥽 Controles en Realidad Virtual (VR)

### Agarrar el Cilindro
- **Trigger (Gatillo)** o **Grip (Agarre)** - Presiona y mantén en cualquiera de los controladores
  - El cilindro se adjuntará inmediatamente a tu mano
  - La posición de origen es exactamente donde está el nodo del controlador

### Lanzamiento
- Cuando presionas el grip/trigger:
  - El cilindro está en tu mano
  - Se mueve exactamente con la posición del controlador
  
- **Suelta el grip/trigger** para lanzar:
  - El cilindro vuela en la dirección y velocidad de tu movimiento
  - El momentum se captura automáticamente
  - Se generará spin basado en la velocidad del lanzamiento

### Física del Lanzamiento
- **Velocidad lineal**: Se calcula del movimiento reciente del controlador
- **Velocidad angular (Spin)**: Se genera automáticamente (gira alrededor del eje Y)
- **Gravedad**: El cilindro cae naturalmente
- **Colisión**: El cilindro rebota en el suelo

---

## 🎮 Diferencias PC vs VR

| Característica | PC | VR |
|---|---|---|
| **Agarrar** | Spacebar / Click izq | Trigger/Grip controller |
| **Dirección** | Mouse X (horizontal) | Posición del controller |
| **Fuerza** | Mouse Y (vertical) | Velocidad del movimiento |
| **Origen** | Centro fijo de pantalla | Node del controller |
| **Momentum** | Escalado manualmente | Capturado del movimiento |

---

## 📝 Notas Técnicas

- Los controles en PC se desactivan automáticamente cuando entras en modo VR
- El cilindro está escala en unidades de Three.js (radio: 0.18, altura: 0.06)
- La escala de velocidad es ajustable en el código (actualmente 20x para PC, variable para VR)
- Los controles ya incluyen rotación angular para dar realismo al giro del cilindro

---

## 🔧 Ajustes Disponibles

En `src/js/controls.js`:
- `holdDistance`: Distancia a la que se sostiene el cilindro (0.3)
- `holdHeight`: Altura al sostener (0.1)
- `force` multiplier: Escala de fuerza máxima (20)

En `src/js/app.js`:
- `releaseVelocityScale`: Amplificador de velocidad en VR (1.6)
- `gravity`: Gravedad del mundo (-9.81)

