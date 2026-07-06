import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  applyDomainMultiplier,
  averageVolumeByExercise,
  calculateCursedEnergy,
  calculateMissionsForToday,
  createBindingVow,
  defaultWeekendBoss,
  DOMAIN_DURATION_DAYS,
  DOMAIN_STREAK_DAYS,
  gradeForXp,
  resolveMissions,
  settleBindingVow,
  updateStreak,
} from './src/domain/gameLogic';
import { createStarterProfile } from './src/domain/profileFactory';
import { firebaseConfig } from './src/config/firebase';
import { trackEvent } from './src/services/analytics';
import { hydrateProfile, loadLocalProfile, migrateGuestProfileToUser, saveProfile } from './src/services/profileRepository';
import { signInWithGoogleToken } from './src/services/firebaseClient';
import { Routine, UserProfile, WorkoutEntry } from './src/types/models';

WebBrowser.maybeCompleteAuthSession();

type Tab = 'Entrenar' | 'Rutinas' | 'Misiones' | 'Perfil';

const tabOrder: Tab[] = ['Entrenar', 'Rutinas', 'Misiones', 'Perfil'];

function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function App() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('Entrenar');
  const [nameInput, setNameInput] = useState('');
  const [loading, setLoading] = useState(true);

  const [exercise, setExercise] = useState('Bench Press');
  const [weightKg, setWeightKg] = useState('40');
  const [reps, setReps] = useState('8');
  const [rpe, setRpe] = useState('7');

  const [routineName, setRoutineName] = useState('');
  const [restSeconds, setRestSeconds] = useState(0);
  const [restRunning, setRestRunning] = useState(false);

  const [vowEnergyTarget, setVowEnergyTarget] = useState('1800');

  const [, response, promptAsync] = Google.useAuthRequest({
    androidClientId: firebaseConfig.androidClientId,
    iosClientId: firebaseConfig.iosClientId,
    clientId: firebaseConfig.expoClientId ?? firebaseConfig.webClientId,
    webClientId: firebaseConfig.webClientId,
  });

  useEffect(() => {
    (async () => {
      const existing = await loadLocalProfile();
      if (existing) {
        setProfile(existing);
      }
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!response || response.type !== 'success') return;
    const token = response.authentication?.idToken ?? response.params?.id_token;
    if (!token) {
      Alert.alert('Google Sign-In', 'No se pudo obtener ID token.');
      return;
    }

    (async () => {
      try {
        const googleUser = await signInWithGoogleToken(token);
        const cloudProfile = await hydrateProfile(googleUser.id);
        const local = await loadLocalProfile();

        const next = local && local.isGuest
          ? await migrateGuestProfileToUser(local, googleUser.id, googleUser.email)
          : cloudProfile ?? createStarterProfile(googleUser.displayName, googleUser.id, false, googleUser.email);

        await saveProfile(next);
        trackEvent('login_google');
        setProfile(next);
      } catch (error) {
        Alert.alert('Google Sign-In', error instanceof Error ? error.message : 'Error desconocido');
      }
    })();
  }, [response]);

  useEffect(() => {
    if (!restRunning) return;
    const timer = setInterval(() => setRestSeconds((prev) => (prev > 0 ? prev - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, [restRunning]);

  useEffect(() => {
    if (restSeconds === 0) {
      setRestRunning(false);
    }
  }, [restSeconds]);

  const avgVolume = useMemo(() => (profile ? averageVolumeByExercise(profile) : {}), [profile]);

  async function persist(next: UserProfile) {
    setProfile(next);
    await saveProfile(next);
  }

  async function enterAsGuest() {
    const displayName = nameInput.trim() || 'Hechicero Invitado';
    const starter = createStarterProfile(displayName, uid('guest'), true);
    await saveProfile(starter);
    setProfile(starter);
    trackEvent('login_guest');
  }

  async function logWorkout() {
    if (!profile) return;

    const parsedWeight = Number(weightKg);
    const parsedReps = Number(reps);
    const parsedRpe = Number(rpe);

    if (!exercise.trim() || Number.isNaN(parsedWeight) || Number.isNaN(parsedReps) || Number.isNaN(parsedRpe)) {
      Alert.alert('Entrada inválida', 'Completa ejercicio, peso, reps y RPE válidos.');
      return;
    }

    const now = new Date().toISOString();
    const baseEnergy = calculateCursedEnergy(parsedWeight, parsedReps, parsedRpe);
    const boostedEnergy = applyDomainMultiplier(baseEnergy, profile.domainUntil, now);

    const streakChange = updateStreak(profile.lastWorkoutDate, now);
    const streakDays = streakChange === 0
      ? profile.streakDays
      : streakChange === 1
        ? profile.streakDays + 1
        : 1;

    const domainUntil = streakDays >= DOMAIN_STREAK_DAYS
      ? new Date(new Date(now).getTime() + DOMAIN_DURATION_DAYS * 24 * 60 * 60 * 1000).toISOString()
      : profile.domainUntil;

    const workout: WorkoutEntry = {
      id: uid('workout'),
      createdAt: now,
      exercise: exercise.trim(),
      weightKg: parsedWeight,
      reps: parsedReps,
      rpe: parsedRpe,
      volume: parsedWeight * parsedReps,
      cursedEnergy: boostedEnergy,
    };

    const missions = profile.missions.map((mission) => {
      if (mission.id.includes('energy')) {
        return { ...mission, currentValue: mission.currentValue + boostedEnergy };
      }
      if (mission.id.includes('reps')) {
        return { ...mission, currentValue: mission.currentValue + parsedReps };
      }
      return mission;
    });

    const afterMissionCheck = {
      ...profile,
      workouts: [workout, ...profile.workouts].slice(0, 200),
      cursedEnergy: profile.cursedEnergy + boostedEnergy,
      xp: profile.xp + Math.round(boostedEnergy * 0.35),
      weekendBoss: {
        ...profile.weekendBoss,
        hp: Math.max(profile.weekendBoss.hp - boostedEnergy, 0),
        escaped: profile.weekendBoss.hp - boostedEnergy <= 0 ? false : profile.weekendBoss.escaped,
      },
      streakDays,
      lastWorkoutDate: now,
      domainUntil,
      missions,
      updatedAt: now,
    };

    const rewards = resolveMissions(afterMissionCheck);

    const settledVow = settleBindingVow(afterMissionCheck, now);

    const next: UserProfile = {
      ...afterMissionCheck,
      missions: rewards.missions,
      xp: afterMissionCheck.xp + rewards.xpGain + (settledVow?.xpDelta ?? 0),
      currency: afterMissionCheck.currency + rewards.currencyGain,
      bindingVow: settledVow
        ? { ...afterMissionCheck.bindingVow!, fulfilled: settledVow.fulfilled }
        : afterMissionCheck.bindingVow,
    };

    const rollover = now.slice(0, 10) !== profile.updatedAt.slice(0, 10);
    if (rollover) {
      next.missions = calculateMissionsForToday(now);
      next.weekendBoss = defaultWeekendBoss(now);
    }

    next.grade = gradeForXp(next.xp);

    await persist(next);
    trackEvent('workout_logged', { exercise: workout.exercise, energy: boostedEnergy });

    if (rewards.xpGain > 0) {
      trackEvent('mission_completed', { xp: rewards.xpGain });
    }
    if (settledVow) {
      trackEvent('vow_resolved', settledVow);
    }
  }

  async function createRoutine() {
    if (!profile || !routineName.trim()) return;

    const routine: Routine = {
      id: uid('routine'),
      name: routineName,
      focus: 'Tren Superior',
      exercises: [],
    };

    await persist({
      ...profile,
      routines: [routine, ...profile.routines],
      updatedAt: new Date().toISOString(),
    });
    setRoutineName('');
  }

  async function createVow() {
    if (!profile) return;
    const target = Number(vowEnergyTarget);
    if (Number.isNaN(target) || target <= 0) {
      Alert.alert('Pacto inválido', 'Ingresa una meta de energía válida.');
      return;
    }

    const vow = createBindingVow(new Date().toISOString(), 'Entrenamiento extremo del fin de semana', target);
    const next = { ...profile, bindingVow: vow, updatedAt: new Date().toISOString() };
    await persist(next);
    trackEvent('vow_created', { target });
  }

  if (loading) {
    return <View style={styles.center}><Text style={styles.title}>Invocando Energía Maldita...</Text></View>;
  }

  if (!profile) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <Text style={styles.title}>Jujutsu-Fit</Text>
        <Text style={styles.subtitle}>Convierte tu entrenamiento en exorcismos.</Text>
        <TextInput
          placeholder="Nombre de hechicero"
          placeholderTextColor="#8d93ad"
          style={styles.input}
          value={nameInput}
          onChangeText={setNameInput}
        />
        <Pressable style={styles.primaryButton} onPress={enterAsGuest}>
          <Text style={styles.buttonText}>Entrar como Invitado</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={() => promptAsync()}>
          <Text style={styles.buttonText}>Google Sign-In</Text>
        </Pressable>
        <Text style={styles.caption}>Si usas invitado, tus datos se migran al iniciar con Google después.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Text style={styles.title}>{profile.name} · {profile.grade}</Text>
      <Text style={styles.subtitle}>XP {profile.xp} · Energía {profile.cursedEnergy} · Racha {profile.streakDays}</Text>

      <View style={styles.tabs}>
        {tabOrder.map((tab) => (
          <Pressable key={tab} onPress={() => setActiveTab(tab)} style={[styles.tab, activeTab === tab && styles.tabActive]}>
            <Text style={styles.tabText}>{tab}</Text>
          </Pressable>
        ))}
      </View>

      <ScrollView style={styles.panel} contentContainerStyle={{ gap: 12, paddingBottom: 24 }}>
        {activeTab === 'Entrenar' && (
          <>
            <TextInput style={styles.input} value={exercise} onChangeText={setExercise} placeholder="Ejercicio" placeholderTextColor="#8d93ad" />
            <TextInput style={styles.input} value={weightKg} onChangeText={setWeightKg} keyboardType="numeric" placeholder="Peso (kg)" placeholderTextColor="#8d93ad" />
            <TextInput style={styles.input} value={reps} onChangeText={setReps} keyboardType="numeric" placeholder="Reps" placeholderTextColor="#8d93ad" />
            <TextInput style={styles.input} value={rpe} onChangeText={setRpe} keyboardType="numeric" placeholder="RPE" placeholderTextColor="#8d93ad" />
            <Pressable style={styles.primaryButton} onPress={logWorkout}>
              <Text style={styles.buttonText}>Registrar Combate</Text>
            </Pressable>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Temporizador de Descanso</Text>
              <Text style={styles.metric}>{restSeconds}s</Text>
              <View style={styles.inlineButtons}>
                <Pressable style={styles.secondaryButton} onPress={() => { setRestSeconds(90); setRestRunning(true); }}><Text style={styles.buttonText}>90s</Text></Pressable>
                <Pressable style={styles.secondaryButton} onPress={() => { setRestSeconds(120); setRestRunning(true); }}><Text style={styles.buttonText}>120s</Text></Pressable>
                <Pressable style={styles.secondaryButton} onPress={() => { setRestSeconds(0); setRestRunning(false); }}><Text style={styles.buttonText}>Reset</Text></Pressable>
              </View>
            </View>
          </>
        )}

        {activeTab === 'Rutinas' && (
          <>
            <TextInput style={styles.input} value={routineName} onChangeText={setRoutineName} placeholder="Nueva rutina" placeholderTextColor="#8d93ad" />
            <Pressable style={styles.primaryButton} onPress={createRoutine}><Text style={styles.buttonText}>Crear Rutina</Text></Pressable>
            {profile.routines.map((routine) => (
              <View key={routine.id} style={styles.card}><Text style={styles.cardTitle}>{routine.name}</Text><Text style={styles.caption}>{routine.focus}</Text></View>
            ))}
          </>
        )}

        {activeTab === 'Misiones' && (
          <>
            {profile.missions.map((mission) => (
              <View key={mission.id} style={styles.card}>
                <Text style={styles.cardTitle}>{mission.title}</Text>
                <Text style={styles.caption}>{mission.description}</Text>
                <Text style={styles.metric}>{mission.currentValue} / {mission.targetValue}</Text>
              </View>
            ))}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{profile.weekendBoss.name}</Text>
              <Text style={styles.metric}>HP {profile.weekendBoss.hp}/{profile.weekendBoss.maxHp}</Text>
            </View>
          </>
        )}

        {activeTab === 'Perfil' && (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Expansión de Dominio</Text>
              <Text style={styles.caption}>Activa con {DOMAIN_STREAK_DAYS} días seguidos. Multiplicador x1.5 por 2 días.</Text>
              <Text style={styles.metric}>{profile.domainUntil && new Date(profile.domainUntil) >= new Date() ? 'ACTIVO' : 'INACTIVO'}</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Pacto Vinculante</Text>
              <TextInput
                style={styles.input}
                value={vowEnergyTarget}
                onChangeText={setVowEnergyTarget}
                keyboardType="numeric"
                placeholder="Meta de energía semanal"
                placeholderTextColor="#8d93ad"
              />
              <Pressable style={styles.secondaryButton} onPress={createVow}><Text style={styles.buttonText}>Activar Pacto</Text></Pressable>
              {profile.bindingVow && (
                <Text style={styles.caption}>Meta: {profile.bindingVow.targetEnergy} · Estado: {profile.bindingVow.fulfilled === null ? 'Pendiente' : profile.bindingVow.fulfilled ? 'Cumplido' : 'Fallido'}</Text>
              )}
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Sobrecarga Progresiva</Text>
              {Object.entries(avgVolume).length === 0 ? (
                <Text style={styles.caption}>Sin datos aún.</Text>
              ) : (
                Object.entries(avgVolume).map(([exerciseName, avg]) => (
                  <Text key={exerciseName} style={styles.caption}>{exerciseName}: volumen medio {avg}</Text>
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0c13',
  },
  container: {
    flex: 1,
    backgroundColor: '#0a0c13',
    paddingTop: 56,
    paddingHorizontal: 16,
    gap: 12,
  },
  title: {
    color: '#f7f8fb',
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    color: '#c9cde2',
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: '#313758',
    borderRadius: 10,
    padding: 12,
    color: '#f7f8fb',
    backgroundColor: '#111528',
  },
  primaryButton: {
    backgroundColor: '#4735f0',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: '#1f2540',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#f7f8fb',
    fontWeight: '600',
  },
  caption: {
    color: '#9ea5c5',
    fontSize: 13,
  },
  tabs: {
    flexDirection: 'row',
    gap: 8,
  },
  tab: {
    flex: 1,
    borderRadius: 8,
    backgroundColor: '#121a33',
    paddingVertical: 8,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#6029ff',
  },
  tabText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  panel: {
    flex: 1,
  },
  card: {
    borderWidth: 1,
    borderColor: '#2f3557',
    borderRadius: 12,
    padding: 12,
    gap: 6,
    backgroundColor: '#10172d',
  },
  cardTitle: {
    color: '#e9ecff',
    fontWeight: '700',
  },
  metric: {
    color: '#7cc2ff',
    fontSize: 18,
    fontWeight: '700',
  },
  inlineButtons: {
    flexDirection: 'row',
    gap: 8,
  },
});
