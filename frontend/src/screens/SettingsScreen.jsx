import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import LanguageSelector from '../components/LanguageSelector';
import { getLang, setLang } from '../lang';
import { colors } from '../../constants/theme';

export default function SettingsScreen() {
  const [lang, setLangState] = useState(() => getLang() || 'en');

  useEffect(() => {
    if (lang) setLang(lang);
  }, [lang]);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Settings</Text>
      <View style={styles.section}>
        <Text style={styles.label}>Language</Text>
        <LanguageSelector currentLang={lang} onChange={setLangState} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 16 },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: colors.textPrimary },
  section: { marginBottom: 20 },
  label: { fontSize: 16, fontWeight: '600', marginBottom: 8, color: colors.textSecondary },
});