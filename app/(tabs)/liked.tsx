import React, { useEffect, useState } from 'react';
import { View, FlatList, Text, Button } from 'react-native';
import { API_BASE_URL } from '../src/config';
import type { AnimeCard } from '../src/components/types';

export default function LikedScreen() {
  const [items, setItems] = useState<AnimeCard[]>([]);

  async function load() {
    const res = await fetch(`${API_BASE_URL}/api/liked`);
    const json = await res.json();
    setItems(json.items || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(id: number) {
    await fetch(`${API_BASE_URL}/api/like/${id}`, { method: 'DELETE' });
    await load();
  }

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <View style={{ paddingVertical: 12, borderBottomWidth: 1, borderColor: '#eee' }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold' }}>{item.title}</Text>
            {item.year ? <Text style={{ color: '#666' }}>{item.year}</Text> : null}
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
              <Button title="Remove" onPress={() => remove(item.id)} />
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 24 }}>No liked anime yet.</Text>}
      />
    </View>
  );
}