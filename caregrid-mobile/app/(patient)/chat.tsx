import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/lib/data';

interface Message {
  id: string; role:'ai'|'user'; text: string;
  emergency?: boolean; tips?: string[];
}

function getAIResponse(input: string): Omit<Message,'id'> {
  const l = input.toLowerCase();
  if (/chest pain|heart/.test(l)) return { role:'ai', emergency:true, text:'🚨 EMERGENCY: Chest pain needs immediate attention. PHC-North has been alerted for an emergency bed. Call 108 NOW.' };
  if (/fever|temperature/.test(l)) return { role:'ai', text:'Based on your symptoms, I recommend visiting PHC-North (20 min wait).\n\nFor relief: drink fluids, take Paracetamol 500mg if temp > 38.5°C.', tips:['Drink 8–10 glasses of water','Rest and avoid exertion','Paracetamol every 6hrs if temp > 38.5°C','See doctor if fever persists > 3 days'] };
  if (/headache/.test(l)) return { role:'ai', text:'For headache, PHC-Beta has a GP available (~1hr wait).\n\nRest in a dark room, stay hydrated, avoid screens.', tips:['Rest in dark, quiet room','Apply cold compress','Stay hydrated','Avoid screens and bright light'] };
  if (/cough|cold/.test(l)) return { role:'ai', text:'For cough/cold, PHC-North (20 min wait) is your best option today.\n\nHome care: warm water with honey, steam inhalation.', tips:['Warm water with honey & ginger','Steam inhalation 2x daily','Rest and stay warm'] };
  if (/dengue|mosquito/.test(l)) return { role:'ai', text:'Given the active dengue alert in Karungal ward, please visit CHC-Central (15 min wait) for a rapid test. Use mosquito repellent.' };
  if (/emergency|108/.test(l)) return { role:'ai', emergency:true, text:'For emergencies call 108 immediately. CHC-Central (2.1 km) has 24/7 emergency services.' };
  return { role:'ai', text:"I understand. Can you describe your symptoms in more detail? For example — how long have you had this? Do you have fever, pain, or breathing difficulty?" };
}

const CHIPS = ['Fever','Headache','Cough','Chest Pain','Dengue','Emergency'];
const WELCOME: Message = { id:'welcome', role:'ai', text:"Hello! I'm your Swasthiya Setu Health Assistant 🏥\n\nDescribe your symptoms in Hindi, Tamil, or English. I'll help you find the right care and give first aid guidance." };

function Bubble({ msg }: { msg: Message }) {
  const [tipsOpen, setTipsOpen] = useState(false);
  const isAI = msg.role === 'ai';
  return (
    <View style={[styles.msgRow, isAI ? styles.msgRowLeft : styles.msgRowRight]}>
      {isAI && (
        <View style={styles.aiBubbleAvatar}>
          <Ionicons name="medical" size={12} color="#fff" />
        </View>
      )}
      <View style={{ maxWidth:'80%' }}>
        <View style={[
          styles.bubble,
          msg.emergency ? styles.bubbleEmergency : isAI ? styles.bubbleAI : styles.bubbleUser
        ]}>
          {msg.emergency && (
            <View style={{ flexDirection:'row', alignItems:'center', gap:4, marginBottom:4 }}>
              <Ionicons name="warning" size={12} color="#fff" />
              <Text style={{ color:'#fff', fontWeight:'800', fontSize:10 }}>EMERGENCY ALERT</Text>
            </View>
          )}
          <Text style={[styles.bubbleText, (msg.emergency || !isAI) && { color:'#fff' }]}>
            {msg.text}
          </Text>
          {msg.emergency && (
            <TouchableOpacity style={styles.callBtn}>
              <Ionicons name="call" size={14} color={COLORS.red} />
              <Text style={[styles.callBtnText]}>CALL 108</Text>
            </TouchableOpacity>
          )}
        </View>
        {msg.tips && (
          <TouchableOpacity onPress={() => setTipsOpen(o=>!o)} style={styles.tipsToggle}>
            <Ionicons name="medkit" size={12} color={COLORS.green} />
            <Text style={styles.tipsLabel}>First Aid Tips</Text>
            <Ionicons name={tipsOpen?'chevron-up':'chevron-down'} size={12} color={COLORS.green} />
          </TouchableOpacity>
        )}
        {msg.tips && tipsOpen && (
          <View style={styles.tipsList}>
            {msg.tips.map((t,i) => (
              <Text key={i} style={styles.tipItem}>• {t}</Text>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

function TypingIndicator() {
  const dots = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];
  useEffect(() => {
    dots.forEach((d,i) => {
      Animated.loop(Animated.sequence([
        Animated.delay(i*200),
        Animated.timing(d, { toValue:1, duration:300, useNativeDriver:true }),
        Animated.timing(d, { toValue:0, duration:300, useNativeDriver:true }),
      ])).start();
    });
  }, []);
  return (
    <View style={[styles.msgRow, styles.msgRowLeft]}>
      <View style={styles.aiBubbleAvatar}><Ionicons name="medical" size={12} color="#fff" /></View>
      <View style={[styles.bubble, styles.bubbleAI, { paddingVertical:12 }]}>
        <View style={{ flexDirection:'row', gap:4, alignItems:'center' }}>
          {dots.map((d,i) => (
            <Animated.View key={i} style={[styles.typeDot, { transform:[{ translateY: d.interpolate({ inputRange:[0,1], outputRange:[0,-4] }) }] }]} />
          ))}
        </View>
      </View>
    </View>
  );
}

export default function PatientChat() {
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [listening, setListening] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const [lang, setLang] = useState('EN');

  const send = (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), role:'user', text };
    setMessages(p => [...p, userMsg]);
    setInput('');
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      const ai: Message = { id: (Date.now()+1).toString(), ...getAIResponse(text) };
      setMessages(p => [...p, ai]);
    }, 1200);
  };

  const handleVoice = () => {
    setListening(true);
    setTimeout(() => {
      setListening(false);
      const transcript = 'I have had a high fever for two days';
      send(transcript);
    }, 2000);
  };

  useEffect(() => { setTimeout(() => scrollRef.current?.scrollToEnd({ animated:true }), 100); }, [messages, typing]);

  return (
    <KeyboardAvoidingView style={{ flex:1 }} behavior={Platform.OS==='ios'?'padding':'height'}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.aiAvatar}>
            <Ionicons name="medical" size={18} color="#fff" />
            <View style={styles.onlineDot} />
          </View>
          <View style={{ flex:1 }}>
            <Text style={styles.headerTitle}>Swasthiya Setu Assistant</Text>
            <View style={{ flexDirection:'row', gap:6, marginTop:3 }}>
              <View style={styles.geminiBadge}><Text style={styles.geminiText}>Gemini-powered</Text></View>
              <View style={styles.offlineBadge}><Ionicons name="wifi" size={10} color={COLORS.green} /><Text style={styles.offlineText}> Works offline</Text></View>
            </View>
          </View>
          {/* Language */}
          <View style={{ flexDirection:'row', gap:4 }}>
            {['EN','हिं','தமி'].map(l => (
              <TouchableOpacity key={l} onPress={() => setLang(l)} style={[styles.langBtn, lang===l && styles.langBtnActive]}>
                <Text style={[styles.langText, lang===l && { color:COLORS.primary, fontWeight:'700' }]}>{l}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Messages */}
        <ScrollView ref={scrollRef} style={styles.messages} contentContainerStyle={{ padding:14, paddingBottom:8 }} showsVerticalScrollIndicator={false}>
          {messages.map(m => <Bubble key={m.id} msg={m} />)}
          {typing && <TypingIndicator />}
        </ScrollView>

        {/* Quick chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips} contentContainerStyle={{ paddingHorizontal:14, gap:6 }}>
          {CHIPS.map(c => (
            <TouchableOpacity key={c} onPress={() => send(c)} style={[styles.chip, c==='Emergency'&&styles.chipDanger]}>
              <Text style={[styles.chipText, c==='Emergency'&&{ color:COLORS.red }]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Input */}
        <View style={styles.inputBar}>
          <View style={styles.inputBox}>
            <TextInput
              style={styles.input}
              placeholder="Describe your symptoms…"
              placeholderTextColor={COLORS.textLight}
              value={input}
              onChangeText={setInput}
              multiline
              onSubmitEditing={() => send(input)}
            />
            <TouchableOpacity onPress={() => send(input)} disabled={!input.trim()}>
              <Ionicons name="send" size={18} color={input.trim() ? COLORS.primary : COLORS.textLight} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={handleVoice} style={[styles.micBtn, listening && styles.micBtnActive]}>
            <Ionicons name="mic" size={20} color="#fff" />
            {listening && <View style={styles.micRing} />}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:'#f8fafc' },
  header: { backgroundColor:'#fff', borderBottomWidth:1, borderBottomColor:COLORS.border, paddingHorizontal:14, paddingTop:52, paddingBottom:12, flexDirection:'row', alignItems:'center', gap:10 },
  aiAvatar: { width:40, height:40, borderRadius:20, backgroundColor:COLORS.primary, alignItems:'center', justifyContent:'center', position:'relative' },
  onlineDot: { position:'absolute', bottom:0, right:0, width:12, height:12, borderRadius:6, backgroundColor:'#22c55e', borderWidth:2, borderColor:'#fff' },
  headerTitle: { fontSize:14, fontWeight:'800', color:COLORS.text },
  geminiBadge: { backgroundColor:'#ede9fe', borderRadius:100, paddingHorizontal:8, paddingVertical:2 },
  geminiText: { fontSize:9, color:'#7c3aed', fontWeight:'700' },
  offlineBadge: { backgroundColor:'#f0fdf4', borderRadius:100, paddingHorizontal:8, paddingVertical:2, flexDirection:'row', alignItems:'center' },
  offlineText: { fontSize:9, color:COLORS.green, fontWeight:'700' },
  langBtn: { paddingHorizontal:8, paddingVertical:4, borderRadius:8, backgroundColor:'#f1f5f9' },
  langBtnActive: { backgroundColor:'#dbeafe' },
  langText: { fontSize:10, color:COLORS.textSub },
  messages: { flex:1 },
  msgRow: { flexDirection:'row', marginBottom:12, alignItems:'flex-end', gap:6 },
  msgRowLeft: { justifyContent:'flex-start' },
  msgRowRight: { justifyContent:'flex-end' },
  aiBubbleAvatar: { width:26, height:26, borderRadius:13, backgroundColor:COLORS.primary, alignItems:'center', justifyContent:'center' },
  bubble: { borderRadius:16, padding:12, maxWidth:'100%' },
  bubbleAI: { backgroundColor:'#fff', borderWidth:1, borderColor:COLORS.border, borderBottomLeftRadius:4, shadowColor:'#000', shadowOpacity:.04, shadowRadius:4, elevation:1 },
  bubbleUser: { backgroundColor:COLORS.primary, borderBottomRightRadius:4 },
  bubbleEmergency: { backgroundColor:COLORS.red, borderBottomLeftRadius:4 },
  bubbleText: { fontSize:13, color:COLORS.text, lineHeight:20 },
  callBtn: { flexDirection:'row', alignItems:'center', gap:6, backgroundColor:'#fff', borderRadius:10, padding:10, marginTop:8, justifyContent:'center' },
  callBtnText: { color:COLORS.red, fontWeight:'900', fontSize:13 },
  tipsToggle: { flexDirection:'row', alignItems:'center', gap:4, backgroundColor:'#f0fdf4', borderRadius:100, paddingHorizontal:10, paddingVertical:5, marginTop:6, alignSelf:'flex-start', borderWidth:1, borderColor:'#bbf7d0' },
  tipsLabel: { fontSize:10, color:COLORS.green, fontWeight:'700', flex:1 },
  tipsList: { backgroundColor:'#f0fdf4', borderRadius:12, padding:10, marginTop:4, borderWidth:1, borderColor:'#bbf7d0' },
  tipItem: { fontSize:11, color:'#166534', marginBottom:4, lineHeight:16 },
  typeDot: { width:8, height:8, borderRadius:4, backgroundColor:COLORS.textLight },
  chips: { backgroundColor:'#fff', borderTopWidth:1, borderTopColor:COLORS.border, paddingVertical:8, maxHeight:44 },
  chip: { backgroundColor:'#eff6ff', borderRadius:100, paddingHorizontal:12, paddingVertical:5, borderWidth:1, borderColor:'#bfdbfe' },
  chipDanger: { backgroundColor:'#fff1f2', borderColor:'#fecaca' },
  chipText: { fontSize:11, color:COLORS.primary, fontWeight:'600' },
  inputBar: { backgroundColor:'#fff', borderTopWidth:1, borderTopColor:COLORS.border, flexDirection:'row', alignItems:'flex-end', paddingHorizontal:12, paddingVertical:10, gap:10 },
  inputBox: { flex:1, backgroundColor:'#f1f5f9', borderRadius:20, flexDirection:'row', alignItems:'flex-end', paddingHorizontal:14, paddingVertical:10, gap:8 },
  input: { flex:1, fontSize:13, color:COLORS.text, maxHeight:100 },
  micBtn: { width:44, height:44, borderRadius:22, backgroundColor:COLORS.primary, alignItems:'center', justifyContent:'center', position:'relative' },
  micBtnActive: { backgroundColor:COLORS.red },
  micRing: { position:'absolute', width:60, height:60, borderRadius:30, borderWidth:2, borderColor:COLORS.red, opacity:.4 },
});
