import React, { useRef, useState } from 'react';
import { View, Dimensions, StyleSheet, TouchableOpacity } from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import TrailerCard from './TrailerCard';
import type { AnimeCard } from './types';
import { colors } from '@/constants/theme';
import { Heart, X } from 'lucide-react-native';

const { width } = Dimensions.get('window');
const VIDEO_HEIGHT = Math.round((width * 9) / 16); // match TrailerCard
const INFO_HEIGHT = 80;

type SwipeDeckProps = {
  cards: AnimeCard[];
  onLike?: (anime: AnimeCard) => void;
  onDislike?: (anime: AnimeCard) => void;
  onSkip?: (anime: AnimeCard) => void;
  onCardChange?: (index: number) => void; // NEW
};

export default function SwipeDeck({
  cards,
  onLike,
  onDislike,
  onSkip,
  onCardChange
}: SwipeDeckProps) {
  const carouselRef = useRef<any>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = () => {
    if (currentIndex < cards.length - 1) {
      carouselRef.current?.next();
    } else {
      onSkip?.(cards[currentIndex]);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <Carousel
        ref={carouselRef}
        width={width}
        height={VIDEO_HEIGHT + INFO_HEIGHT}
        data={cards}
        renderItem={({ item, index }) => (
          <View style={styles.cardContainer}>
            <TrailerCard {...item} isActive={index === currentIndex} />
          </View>
        )}
        onSnapToItem={(index) => {
          setCurrentIndex(index);
          onCardChange?.(index); // 🔹 Notify FeedScreen
        }}
        loop={false}
        style={{ alignSelf: 'center' }}
      />

      {cards.length > 0 && (
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            onPress={() => {
              onDislike?.(cards[currentIndex]);
              handleNext();
            }}
            style={[styles.button, styles.red]}
          >
            <X size={26} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              onLike?.(cards[currentIndex]);
              handleNext();
            }}
            style={[styles.button, styles.green]}
          >
            <Heart size={26} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.card,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  buttonsContainer: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  red: { backgroundColor: '#ff4757' },
  green: { backgroundColor: '#2ed573' },
});