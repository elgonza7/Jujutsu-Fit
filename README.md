# Jujutsu-Fit

Fitness RPG con estética inspirada en Jujutsu Kaisen, centrado en progreso físico real gamificado.

## MVP (primera versión)

Objetivo inicial: **UI 2D fluida + matemáticas de progresión balanceadas + guardado en Firebase (Spark)**.

## 1) Autenticación y seguridad (costo cero)

- Inicio de sesión con **Google Sign-In (OAuth 2.0)**.
- Modo **Invitado** con datos locales.
- Vinculación de progreso local a cuenta Google al registrarse.
- Guardado local protegido con **cifrado AES** (anti-edición manual de stats).

## 2) Guardado en la nube (arquitectura gratuita)

Se prioriza:

- **Firebase (Spark)** con Firestore/Realtime Database.
- Reglas de seguridad por usuario para evitar sobrescritura cruzada.
- Soporte offline (cache local + sincronización al reconectar).

Alternativas compatibles:

- Google Play Games Services (Saved Games).
- Google Drive App Data (JSON oculto).

## 3) Core loop de gamificación

- **Energía Maldita**: volumen/intensidad de entrenamiento convertido a puntos.
- **Sistema de grados**: de Grado 4 hasta Grado Especial.
- **Técnicas rituales**: desbloqueos por PRs y rachas.
- **Expansión de Dominio**:
  - Activa tras 5 días seguidos.
  - Multiplicador x1.5 por 2 días.
  - Se rompe al faltar un día.
- **Pacto Vinculante**:
  - Promesa de entrenamiento extremo en fin de semana.
  - Recompensa alta si cumple.
  - Penalización de experiencia/rango si falla.

## 4) Módulo de fitness (tracker)

- Creador de rutinas (superior, inferior, core, cardio).
- Registro en vivo de peso, repeticiones y RPE.
- Temporizador de descanso con notificaciones temáticas.
- Estadísticas de sobrecarga progresiva (fuerza a lo largo de meses).

## 5) Combates y misiones

- **Mapa de Incidentes** con maldiciones semanales.
- Misiones diarias (objetivos rápidos de volumen/reps).
- Jefes de fin de semana con barra de vida basada en energía acumulada de lunes a viernes.
- Sistema opcional de castigo por inactividad prolongada.

## 6) UI/UX visual

- Estilo **dark fantasy** (negros, morados profundos, acentos neón rojo/azul).
- Avatar equipable con objetos cosméticos obtenidos al entrenar.
- Diario de misiones estilo manga (enemigos derrotados por día).

## Roadmap sugerido por fases

### Fase 1 (MVP)
- Auth Google + Invitado
- Tracker de entrenamiento
- Energía Maldita + rangos básicos
- Firebase Spark con sincronización

### Fase 2
- Misiones diarias y rachas con Dominio
- Técnicas rituales por PRs
- Primer jefe semanal

### Fase 3
- Mapa de incidentes
- Pactos vinculantes
- Personalización de avatar y tienda cosmética
