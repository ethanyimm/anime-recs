import React from 'react';
import { Picker } from '@react-native-picker/picker';

export default function LanguageSelector({ currentLang = 'en', onChange }) {
  return (
    <Picker
      selectedValue={currentLang}
      onValueChange={(value) => onChange(value)}
    >
      <Picker.Item label="English" value="en" />
      <Picker.Item label="日本語" value="ja" />
      <Picker.Item label="한국어" value="ko" />
    </Picker>
  );
}