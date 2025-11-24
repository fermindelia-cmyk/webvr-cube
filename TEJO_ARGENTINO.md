# 🎯 TEJO ARGENTINO - Sistema de Juego

## 📋 Cómo Funciona

### Fase 1: Lanzar el TEJITO (Marcador)
1. El primer jugador lanza el **TEJITO** (cilindro pequeño y oscuro)
   - En PC: Spacebar/Click + Mouse para dirección y fuerza
   - En VR: Grip/Trigger para agarrar y soltar
2. El tejito se detiene en el piso y marca el objetivo

### Fase 2: Lanzar Cilindros
3. Los jugadores lanzan sus **cilindros** (más grandes y de color)
4. El sistema mide la distancia de cada cilindro al tejito
5. **Gana quien queda más cerca** del tejito

---

## 🎮 Controles

### PC
- **Spacebar / Click izquierdo**: Agarrar
- **Mouse X (horizontal)**: Dirección del tiro
- **Mouse Y (vertical)**: Fuerza del tiro
- **Soltar**: Lanzar el cilindro

### VR
- **Grip / Trigger**: Agarrar el cilindro
- **Movimiento del controlador**: Define dirección y fuerza
- **Soltar**: Lanzar con momentum

---

## 🏆 Sistema de Puntuación

- El cilindro más cercano al tejito se **destaca en amarillo**
- La distancia se muestra en la UI
- Se actualiza en tiempo real mientras todos los cilindros están en movimiento

---

## 🎨 Objetos en el Juego

| Objeto | Color | Tamaño | Función |
|--------|-------|--------|---------|
| TEJITO | Gris oscuro | Pequeño (radio 0.08) | Marcador objetivo |
| Cilindro P1 | Naranja | Grande (radio 0.18) | Cilindro del jugador |
| Rectángulo | Blanco | 2.5m × 8m | Área de juego |

---

## 📊 UI en Pantalla

- **Estado del juego**: Indica qué fase está en curso
- **Jugador ganando**: Muestra quién está más cerca del tejito
- **Distancia**: Metros de distancia del líder al tejito

---

## ⚙️ Física Aplicada

- **Fricción**: 0.80 (alta desaceleración)
- **Damping angular**: 0.75 (giro se reduce rápidamente)
- **Gravedad**: -9.81 m/s²
- Los cilindros se detienen automáticamente cuando la velocidad es muy baja

---

## 🔧 Expansión Futura

Para agregar múltiples jugadores:
1. Crear más cilindros con diferentes colores
2. Asignar `playerId` a cada uno
3. El sistema ya calcula scores para todos

