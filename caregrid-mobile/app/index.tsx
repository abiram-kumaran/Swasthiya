import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  TextInput, Animated, ScrollView, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/lib/data';

const ROLES = [
  { emoji:'🏥', title:'Patient',          sub:'Book tokens, find health centres, AI triage',   route:'/(patient)/home',    color:'#0B6CBB' },
  { emoji:'🩺', title:'Clinic Staff',     sub:'Manage patients, inventory & attendance',       route:'/(staff)/dashboard', color:'#1a9b5c' },
  { emoji:'🚚', title:'Logistics Driver', sub:'Medicine delivery & ambulance dispatch',        route:'/(driver)/dispatch', color:'#d97706' },
  { emoji:'🏛️', title:'District Admin',  sub:'District-wide analytics & AI command',          route:'/(admin)/overview',  color:'#7c3aed' },
];

function OTPModal({ onClose }: { onClose: () => void }) {
  const [phone, setPhone] = useState('');
  const [step, setStep] = useState<'phone'|'otp'>('phone');
  const [otp, setOtp] = useState(['','','','','','']);
  const [sending, setSending] = useState(false);
  const refs = useRef<(TextInput|null)[]>([]);

  const sendOtp = () => {
    if (phone.length < 10) { Alert.alert('Invalid Number', 'Enter a valid 10-digit number'); return; }
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setStep('otp');
      // Simulate auto-fill after 1.5s
      setTimeout(() => setOtp(['1','2','3','4','5','6']), 1500);
    }, 800);
  };

  const verify = () => {
    const code = otp.join('');
    if (code.length < 6) { Alert.alert('Invalid OTP', 'Enter the 6-digit code'); return; }
    router.replace('/(patient)/home');
    onClose();
  };

  const handleOtpChange = (idx: number, val: string) => {
    const c = val.replace(/\D/,'').slice(-1);
    const n = [...otp]; n[idx] = c; setOtp(n);
    if (c && idx < 5) refs.current[idx+1]?.focus();
  };

  return (
    <View style={styles.overlay}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ width:'100%', alignItems:'center' }}>
        <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.modal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => step==='otp' ? setStep('phone') : onClose()}>
              <Ionicons name={step==='otp' ? 'arrow-back' : 'close'} size={20} color="rgba(255,255,255,.7)" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Patient Login</Text>
            <View style={{ width:20 }} />
          </View>

          {step === 'phone' ? (
            <>
              <Text style={styles.modalSub}>We'll send a verification code to your number</Text>
              <View style={styles.phoneRow}>
                <View style={styles.flagBox}>
                  <Text style={{ fontSize:18 }}>🇮🇳</Text>
                  <Text style={styles.phoneCode}>+91</Text>
                </View>
                <TextInput
                  style={styles.phoneInput}
                  placeholder="98765 43210"
                  placeholderTextColor="rgba(255,255,255,.4)"
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={phone}
                  onChangeText={t => setPhone(t.replace(/\D/,''))}
                  onSubmitEditing={sendOtp}
                />
              </View>
              <TouchableOpacity onPress={sendOtp} disabled={sending} style={styles.whiteBtn} activeOpacity={0.85}>
                <Text style={styles.whiteBtnText}>{sending ? 'Sending…' : 'Send OTP via SMS'}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.modalSub}>Enter the code sent to {'\n'}<Text style={{color:'#fff',fontWeight:'700'}}>+91 {phone}</Text></Text>
              <View style={styles.otpRow}>
                {otp.map((d,i) => (
                  <TextInput key={i} ref={el => { refs.current[i]=el; }}
                    style={[styles.otpBox, d && styles.otpBoxFilled]}
                    maxLength={1} keyboardType="numeric" value={d}
                    onChangeText={v => handleOtpChange(i,v)}
                    onKeyPress={({ nativeEvent }) => {
                      if (nativeEvent.key==='Backspace' && !d && i>0) refs.current[i-1]?.focus();
                    }}
                  />
                ))}
              </View>
              <TouchableOpacity onPress={verify} style={styles.whiteBtn} activeOpacity={0.85}>
                <Text style={styles.whiteBtnText}>Verify &amp; Continue →</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={sendOtp} style={{ marginTop:12, alignItems:'center' }}>
                <Text style={{ color:'rgba(255,255,255,.6)', fontSize:12 }}>
                  Didn't receive it? <Text style={{color:'#fff',fontWeight:'700'}}>Resend OTP</Text>
                </Text>
              </TouchableOpacity>
            </>
          )}
        </LinearGradient>
      </KeyboardAvoidingView>
    </View>
  );
}

export default function LoginScreen() {
  const [showOtp, setShowOtp] = useState(false);

  return (
    <LinearGradient colors={['#0B6CBB','#084e8a','#05345c']} style={{ flex:1 }}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Logo */}
        <View style={styles.logoSection}>
          <View style={styles.logoBox}>
            <Ionicons name="shield-checkmark" size={36} color="#fff" />
          </View>
          <Text style={styles.appName}>CareGrid AI</Text>
          <Text style={styles.appTagline}>National Health Mission{'\n'}District Healthcare Operations Platform</Text>
          <View style={styles.techRow}>
            {['Gemini AI','Google Maps','Firebase','Offline-First'].map(t => (
              <View key={t} style={styles.techBadge}>
                <Text style={styles.techText}>{t}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Role Cards */}
        <Text style={styles.roleLabel}>Select your role to continue</Text>
        <View style={styles.grid}>
          {ROLES.map((r, i) => (
            <TouchableOpacity
              key={r.title}
              onPress={() => r.title === 'Patient' ? setShowOtp(true) : router.replace(r.route as any)}
              activeOpacity={0.85}
              style={styles.roleCard}
            >
              <Text style={styles.roleEmoji}>{r.emoji}</Text>
              <Text style={[styles.roleTitle, { color: r.color }]}>{r.title}</Text>
              <Text style={styles.roleSub}>{r.sub}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.footer}>Govt. of India · NHM · Powered by Google Cloud</Text>
      </ScrollView>

      {showOtp && <OTPModal onClose={() => setShowOtp(false)} />}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal:20, paddingBottom:40 },
  logoSection: { alignItems:'center', paddingTop:70, paddingBottom:32 },
  logoBox: { width:72, height:72, borderRadius:20, backgroundColor:'rgba(255,255,255,.15)', alignItems:'center', justifyContent:'center', marginBottom:16, borderWidth:1, borderColor:'rgba(255,255,255,.25)' },
  appName: { color:'#fff', fontSize:26, fontWeight:'900', letterSpacing:-.5 },
  appTagline: { color:'rgba(255,255,255,.65)', fontSize:12, textAlign:'center', marginTop:6, lineHeight:18 },
  techRow: { flexDirection:'row', flexWrap:'wrap', gap:6, justifyContent:'center', marginTop:14 },
  techBadge: { backgroundColor:'rgba(255,255,255,.1)', borderRadius:100, paddingHorizontal:10, paddingVertical:4, borderWidth:1, borderColor:'rgba(255,255,255,.2)' },
  techText: { color:'rgba(255,255,255,.7)', fontSize:10, fontWeight:'600' },
  roleLabel: { color:'rgba(255,255,255,.5)', fontSize:10, fontWeight:'700', textTransform:'uppercase', letterSpacing:1.5, textAlign:'center', marginBottom:14 },
  grid: { flexDirection:'row', flexWrap:'wrap', gap:10 },
  roleCard: { width:'47%', backgroundColor:'rgba(255,255,255,.1)', borderRadius:20, padding:16, borderWidth:1, borderColor:'rgba(255,255,255,.2)' },
  roleEmoji: { fontSize:26, marginBottom:8 },
  roleTitle: { fontSize:14, fontWeight:'800', marginBottom:4 },
  roleSub: { fontSize:11, color:'rgba(255,255,255,.6)', lineHeight:16 },
  footer: { color:'rgba(255,255,255,.3)', fontSize:10, textAlign:'center', marginTop:32 },
  // OTP Modal
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor:'rgba(0,0,0,.6)', alignItems:'center', justifyContent:'flex-end', paddingBottom:0, zIndex:999 },
  modal: { width:'100%', borderTopLeftRadius:28, borderTopRightRadius:28, padding:24, paddingBottom:40 },
  modalHeader: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:20 },
  modalTitle: { color:'#fff', fontSize:16, fontWeight:'800' },
  modalSub: { color:'rgba(255,255,255,.7)', fontSize:12, textAlign:'center', marginBottom:20, lineHeight:18 },
  phoneRow: { flexDirection:'row', backgroundColor:'rgba(255,255,255,.12)', borderRadius:14, borderWidth:1, borderColor:'rgba(255,255,255,.2)', overflow:'hidden', marginBottom:16 },
  flagBox: { flexDirection:'row', alignItems:'center', gap:6, paddingHorizontal:14, borderRightWidth:1, borderRightColor:'rgba(255,255,255,.2)' },
  phoneCode: { color:'#fff', fontWeight:'700', fontSize:14 },
  phoneInput: { flex:1, color:'#fff', fontSize:16, paddingHorizontal:14, paddingVertical:14 },
  whiteBtn: { backgroundColor:'#fff', borderRadius:14, paddingVertical:14, alignItems:'center' },
  whiteBtnText: { color:COLORS.primary, fontWeight:'800', fontSize:15 },
  otpRow: { flexDirection:'row', gap:8, justifyContent:'center', marginBottom:20 },
  otpBox: { width:44, height:52, borderRadius:12, borderWidth:2, borderColor:'rgba(255,255,255,.3)', backgroundColor:'rgba(255,255,255,.1)', textAlign:'center', color:'#fff', fontSize:20, fontWeight:'800' },
  otpBoxFilled: { borderColor:'#4ade80', backgroundColor:'rgba(74,222,128,.15)' },
});
