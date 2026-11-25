import 'react-native-url-polyfill/auto';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, AppState, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, processLock } from '@supabase/supabase-js';

// Preencha com a URL do projeto e a chave PUBLICÁVEL (ou anon legada).
// Nunca use service_role ou uma chave secreta no aplicativo.
const SUPABASE_URL = '';
const SUPABASE_KEY = '';
const configured = Boolean(SUPABASE_URL.trim() && SUPABASE_KEY.trim());
const supabase = configured ? createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { storage: AsyncStorage, autoRefreshToken: true, persistSession: true,
    detectSessionInUrl: false, lock: processLock },
}) : null;
const LOCAL_KEY = '@fitlog/demo/v1';
const EMPTY = { name: '', sets: '3', reps: '12', weight: '0' };
const TABS = [['train','Treinos'], ['add','Cadastrar'], ['history','Histórico']];
const formatDate = (s) => new Date(s).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
const metric = (e) => `${e.sets} séries  ·  ${e.reps} rep.  ·  ${Number(e.weight).toLocaleString('pt-BR')} kg`;
const check = (r) => { if (r.error) throw r.error; return r.data; };
const localId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;
let sessionRequest = null;
async function getUser() {
  if (!sessionRequest) {
    sessionRequest = (async () => {
      const { session } = check(await supabase.auth.getSession());
      if (session?.user) return session.user.id;
      const data = check(await supabase.auth.signInAnonymously());
      if (!data.user) throw new Error('Não foi possível criar a sessão.');
      return data.user.id;
    })().finally(() => { sessionRequest = null; });
  }
  return sessionRequest;
}
function Button({ title, onPress, disabled, secondary = false }) {
  return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={({ pressed }) => [s.button, secondary && s.secondary, (pressed || disabled) && { opacity: 0.55 }]}><Text style={[s.buttonText, secondary && { color: '#B8F36D' }]}>{title}</Text></Pressable>;
}
function Field({ title, value, onChangeText, placeholder, numeric, maxLength }) {
  return <View style={s.field}><Text style={s.label}>{title}</Text><TextInput accessibilityLabel={title} style={s.input} value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#77838D" keyboardType={numeric ? 'decimal-pad' : 'default'} maxLength={maxLength} /></View>;
}
function Empty({ title, detail }) { return <View style={s.empty}><Text style={s.cardTitle}>{title}</Text><Text style={s.muted}>{detail}</Text></View>; }
function Fitlog() {
  const [tab, setTab] = useState('train');
  const [exercises, setExercises] = useState([]);
  const [history, setHistory] = useState([]);
  const [userId, setUserId] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const change = (key) => (value) => setForm((prev) => ({ ...prev, [key]: value }));
  const switchTab = (next) => { setNotice(''); setError(''); setTab(next); };
  async function load() {
    setBusy(true); setError(''); setReady(false);
    try {
      if (supabase) {
        const uid = await getUser();
        setUserId(uid);
        const results = await Promise.all([
          supabase.from('fitlog_exercises').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
          supabase.from('fitlog_logs').select('*').eq('user_id', uid).order('completed_at', { ascending: false }),
        ]);
        const a = check(results[0]); const b = check(results[1]);
        setExercises(a); setHistory(b);
      } else {
        const raw = await AsyncStorage.getItem(LOCAL_KEY);
        const data = raw ? JSON.parse(raw) : { exercises: [], history: [] };
        setExercises(data.exercises); setHistory(data.history);
      }
      setReady(true);
    } catch (e) { setError(`Falha ao carregar: ${e.message || String(e)}`); }
    finally { setBusy(false); }
  }
  useEffect(() => {
    load();
    if (!supabase || Platform.OS === 'web') return;
    const update = (state) => state === 'active' ? supabase.auth.startAutoRefresh() : supabase.auth.stopAutoRefresh();
    update(AppState.currentState);
    const sub = AppState.addEventListener('change', update);
    return () => { sub.remove(); supabase.auth.stopAutoRefresh(); };
  }, []);
  async function saveLocal(a, b) {
    await AsyncStorage.setItem(LOCAL_KEY, JSON.stringify({ exercises: a, history: b }));
    setExercises(a); setHistory(b);
  }
  async function add() {
    if (busy || !ready) return;
    setError(''); setNotice('');
    const name = form.name.trim();
    const sets = Number(form.sets), reps = Number(form.reps), weight = Number(form.weight.replace(',', '.'));
    if (!name || name.length > 80 || !/^\d+$/.test(form.sets.trim()) || !/^\d+$/.test(form.reps.trim()) || !Number.isInteger(sets) || sets < 1 || sets > 100 || !Number.isInteger(reps) || reps < 1 || reps > 1000 || !/^\d+(?:[.,]\d{1,2})?$/.test(form.weight.trim()) || !Number.isFinite(weight) || weight < 0 || weight > 1000) {
      setError('Informe um nome, séries de 1 a 100, repetições de 1 a 1000 e carga de 0 a 1000 kg (até 2 casas decimais).'); return;
    }
    setBusy(true);
    const row = { name, sets, reps, weight };
    try {
      if (supabase) {
        const saved = check(await supabase.from('fitlog_exercises').insert({ ...row, user_id: userId }).select().single());
        setExercises((prev) => [saved, ...prev]);
      } else await saveLocal([{ ...row, id: localId(), created_at: new Date().toISOString() }, ...exercises], history);
      setForm(EMPTY); setTab('train'); setNotice('Exercício cadastrado.');
    } catch (e) { setError(`Não foi possível cadastrar: ${e.message || String(e)}`); }
    finally { setBusy(false); }
  }
  async function complete(e) {
    if (busy || !ready) return;
    setBusy(true); setError(''); setNotice('');
    const row = { exercise_id: e.id, name: e.name, sets: e.sets, reps: e.reps, weight: e.weight };
    try {
      if (supabase) {
        const saved = check(await supabase.from('fitlog_logs').insert({ ...row, user_id: userId }).select().single());
        setHistory((prev) => [saved, ...prev]);
      } else await saveLocal(exercises, [{ ...row, id: localId(), completed_at: new Date().toISOString() }, ...history]);
      setNotice(`${e.name}: conclusão registrada.`);
    } catch (err) { setError(`Não foi possível registrar: ${err.message || String(err)}`); }
    finally { setBusy(false); }
  }
  const today = history.filter((r) => new Date(r.completed_at).toDateString() === new Date().toDateString()).length;
  return <SafeAreaView style={s.root} edges={['top','bottom','left','right']}>
    <StatusBar barStyle="light-content" backgroundColor="#101519" />
    <View style={s.header}><View style={s.brandGroup}><View style={s.logoFrame}><Image source={require('./assets/logo.png')} style={s.logo} resizeMode="contain" accessibilityLabel="FITLOG" accessible /></View><Text style={s.muted}>Seu treino, registrado.</Text></View><View style={s.pill}><Text style={s.pillText}>{configured ? (ready ? 'SUPABASE' : 'CONECTANDO') : 'DEMO LOCAL'}</Text></View></View>
    {!configured && <Text style={s.demo}>Modo demonstração: os dados ficam neste dispositivo. Configure o Supabase para usar o banco externo.</Text>}
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      {error ? <Text accessibilityLiveRegion="polite" style={s.error}>{error}</Text> : null}
      {notice ? <Text accessibilityLiveRegion="polite" style={s.notice}>{notice}</Text> : null}
      {!ready ? <View style={s.empty}>{busy ? <ActivityIndicator color="#B8F36D" size="large" /> : <Button title="Tentar novamente" onPress={load} />}</View> : <>
      {tab === 'train' && <>
        <Text style={s.eyebrow}>SEU TREINAMENTO</Text><Text style={s.title}>Meus exercícios</Text><Text style={s.muted}>Registre uma conclusão ao terminar um exercício.</Text>
        <View style={s.stats}><View style={s.stat}><Text style={s.statNumber}>{exercises.length}</Text><Text style={s.muted}>Cadastrados</Text></View><View style={s.stat}><Text style={s.statNumber}>{today}</Text><Text style={s.muted}>Realizados hoje</Text></View></View>
        <Button title="+ Cadastrar exercício" onPress={() => switchTab('add')} secondary disabled={busy} />
        {exercises.length === 0 ? <Empty title="Nenhum exercício cadastrado" detail="Cadastre seu primeiro exercício para iniciar." /> : exercises.map((e) => <View key={e.id} style={s.card}><Text style={s.cardTitle}>{e.name}</Text><Text style={s.muted}>{metric(e)}</Text><Button title="Registrar conclusão" onPress={() => complete(e)} disabled={busy} /></View>)}
      </>}
      {tab === 'add' && <>
        <Text style={s.eyebrow}>ORGANIZE SUA ROTINA</Text><Text style={s.title}>Novo exercício</Text><Text style={s.muted}>Informe os dados planejados do exercício.</Text>
        <View style={s.card}><Field title="Nome do exercício" value={form.name} onChangeText={change('name')} placeholder="Ex.: Supino reto" maxLength={80} /><Field title="Séries" value={form.sets} onChangeText={change('sets')} numeric maxLength={3}/><Field title="Repetições por série" value={form.reps} onChangeText={change('reps')} numeric maxLength={4}/><Field title="Carga (kg)" value={form.weight} onChangeText={change('weight')} numeric maxLength={7}/><Button title={busy ? 'Salvando...' : 'Salvar exercício'} onPress={add} disabled={busy}/></View>
      </>}
      {tab === 'history' && <>
        <Text style={s.eyebrow}>ACOMPANHAMENTO</Text><Text style={s.title}>Histórico</Text><Text style={s.muted}>{history.length} registro(s) de exercícios concluídos.</Text>
        {history.length === 0 ? <Empty title="Histórico vazio" detail="Registre uma conclusão na aba Treinos." /> : history.map((r) => <View key={r.id} style={s.card}><Text style={s.eyebrow}>{formatDate(r.completed_at)}</Text><Text style={s.cardTitle}>{r.name}</Text><Text style={s.muted}>{metric(r)}</Text></View>)}
        <Button title="Atualizar histórico" secondary disabled={busy} onPress={load}/>
      </>}
      </>}
    </ScrollView>
    </KeyboardAvoidingView>
    <View style={s.nav}>{TABS.map(([id, name], idx) => <Pressable key={id} accessibilityRole="tab" accessibilityState={{ selected: tab === id, disabled: busy || !ready }} disabled={busy || !ready} onPress={() => switchTab(id)} style={[s.navItem, tab === id && s.navActive]}><Text style={[s.navNumber, tab === id && s.accent]}>0{idx + 1}</Text><Text style={[s.navLabel, tab === id && s.accent]}>{name}</Text></Pressable>)}</View>
  </SafeAreaView>;
}
export default function App() { return <SafeAreaProvider><Fitlog /></SafeAreaProvider>; }
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#101519' }, header: { paddingHorizontal: 20, paddingVertical: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderColor: '#2B353B' }, brandGroup: { flex: 1, gap: 5, alignItems: 'flex-start', marginRight: 8 }, logoFrame: { backgroundColor: '#F4F7F5', borderRadius: 12, padding: 5, alignItems: 'center', justifyContent: 'center' }, logo: { width: 96, height: 76 }, accent: { color: '#B8F36D' }, muted: { color: '#A7B5BB', fontSize: 14, lineHeight: 20 }, pill: { backgroundColor: '#263629', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 20 }, pillText: { color: '#B8F36D', fontSize: 10, fontWeight: '800' }, demo: { color: '#F6D38C', backgroundColor: '#30291D', padding: 12, fontSize: 12, lineHeight: 18 }, content: { padding: 20, gap: 14, paddingBottom: 28 }, eyebrow: { color: '#B8F36D', fontSize: 11, fontWeight: '800', letterSpacing: 1 }, title: { color: '#F4F7F5', fontSize: 30, fontWeight: '800', letterSpacing: -0.8 }, stats: { flexDirection: 'row', gap: 12 }, stat: { flex: 1, padding: 16, backgroundColor: '#1C262B', borderRadius: 14, borderColor: '#354149', borderWidth: 1 }, statNumber: { fontSize: 32, color: '#B8F36D', fontWeight: '800' }, card: { backgroundColor: '#1C262B', borderWidth: 1, borderColor: '#354149', padding: 16, borderRadius: 14, gap: 12 }, cardTitle: { fontSize: 18, fontWeight: '700', color: '#F4F7F5' }, empty: { padding: 24, borderWidth: 1, borderColor: '#354149', borderRadius: 14, gap: 8, backgroundColor: '#1C262B' }, field: { gap: 6 }, label: { color: '#DFE7E8', fontWeight: '600', fontSize: 14 }, input: { color: '#F4F7F5', borderWidth: 1, borderColor: '#43515B', backgroundColor: '#101519', borderRadius: 10, padding: 13, fontSize: 16 }, button: { backgroundColor: '#B8F36D', padding: 14, borderRadius: 10, alignItems: 'center' }, buttonText: { color: '#142019', fontSize: 15, fontWeight: '800' }, secondary: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#B8F36D' }, notice: { backgroundColor: '#233C2B', color: '#C5F5A1', padding: 12, borderRadius: 8 }, error: { backgroundColor: '#43262B', color: '#FFD0D2', padding: 12, borderRadius: 8 }, nav: { flexDirection: 'row', padding: 10, gap: 6, borderTopWidth: 1, borderColor: '#2B353B', backgroundColor: '#151D21' }, navItem: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10, gap: 3 }, navActive: { backgroundColor: '#263629' }, navNumber: { color: '#A7B5BB', fontSize: 10, fontWeight: '800' }, navLabel: { fontSize: 13, fontWeight: '700', color: '#A7B5BB' },
});
