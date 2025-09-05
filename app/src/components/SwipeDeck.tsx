import React, { useRef, useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import Swiper from 'react-native-deck-swiper';
import { Heart, X, Bookmark } from 'lucide-react-native';
import TrailerCard from './TrailerCard';
import type { AnimeCard } from './types';

type SwipeDeckProps = {
  cards: AnimeCard[];
  onSave?: (anime: AnimeCard) => void;     // manual save/bookmark
  onLike?: (anime: AnimeCard) => void;     // right swipe
  onWatched?: (anime: AnimeCard) => void;  // left swipe
  onSkip?: (anime: AnimeCard) => void;     // up swipe
};

export default function SwipeDeck({ cards, onSave, onLike, onWatched, onSkip }: SwipeDeckProps) {
  const swiperRef = useRef<Swiper<AnimeCard>>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  return (
    <View style={{ flex: 1 }}>
      <Swiper
        ref={swiperRef}
        cards={cards}
        renderCard={(card) => (card ? <TrailerCard {...card} /> : null)}
        onSwipedRight={(i) => onLike?.(cards[i])}
        onSwipedLeft={(i) => onWatched?.(cards[i])}
        onSwipedTop={(i) => onSkip?.(cards[i])}
        onSwiped={(i) => setCurrentIndex(i + 1)}
        stackSize={3}
        cardIndex={currentIndex}
        backgroundColor="transparent"
      />

      <View style={{ flexDirection: 'row', justifyContent: 'space-evenly', paddingVertical: 20 }}>
        <TouchableOpacity onPress={() => swiperRef.current?.swipeLeft()}>
          <X size={32} color="#d9534f" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            const card = cards[currentIndex];
            if (card) onSave?.(card);
          }}
        >
          <Bookmark size={32} color="#6c757d" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => swiperRef.current?.swipeRight()}>
          <Heart size={32} color="#28a745" />
        </TouchableOpacity>
      </View>
    </View>
  );
}