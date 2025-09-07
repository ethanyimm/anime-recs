import React, { useRef, useState } from 'react';
import { View, TouchableOpacity, Dimensions, StyleSheet } from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import Animated, { withSpring } from 'react-native-reanimated';
import { Heart, X, Bookmark } from 'lucide-react-native';
import TrailerCard from './TrailerCard';
import type { AnimeCard } from './types';
import { colors } from '@/constants/theme';

const { width, height } = Dimensions.get('window');

type SwipeDeckProps = {
  cards: AnimeCard[];
  onSave?: (anime: AnimeCard) => void;
  onLike?: (anime: AnimeCard) => void;
  onDislike?: (anime: AnimeCard) => void;
  onSkip?: (anime: AnimeCard) => void;
};

export default function SwipeDeck({ cards, onSave, onLike, onDislike }: SwipeDeckProps) {
  const carouselRef = useRef<any>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  return (
    <View style={{ flex: 1 }}>
      <Carousel
        ref={carouselRef}
        width={width * 0.92}
        height={height * 0.68}
        data={cards}
        renderItem={({ item, index }) => {
          const isActive = index === currentIndex;
          return (
            <Animated.View
              style={[
                styles.cardContainer,
                { transform: [{ scale: withSpring(isActive ? 1 : 0.95) }] },
              ]}
            >
              <TrailerCard {...item} />
            </Animated.View>
          );
        }}
        onSnapToItem={(index) => setCurrentIndex(index)}
        loop={false}
        style={{ alignSelf: 'center' }}
        mode="horizontal-stack"
        modeConfig={{
          snapDirection: 'left',
          stackInterval: 18,
        }}
      />

      {/* Action Buttons */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.danger }]}
          onPress={() => {
            onDislike?.(cards[currentIndex]);
            carouselRef.current?.next();
          }}
        >
          <X size={28} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.border }]}
          onPress={() => {
            const card = cards[currentIndex];
            if (card) onSave?.(card);
          }}
        >
          <Bookmark size={28} color={colors.textPrimary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.success }]}
          onPress={() => {
            onLike?.(cards[currentIndex]);
            carouselRef.current?.next();
          }}
        >
          <Heart size={28} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.card,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingVertical: 20,
  },
  actionButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
});
