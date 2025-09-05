import React from 'react';
import Swiper from 'react-native-deck-swiper';
import TrailerCard from './TrailerCard';

export type AnimeCard = {
  title: string;
  genres?: string[];
  year?: number | string;
  synopsis?: string;
  trailerId?: string;
};

type SwipeDeckProps = {
  cards: AnimeCard[];
  onSave?: (anime: AnimeCard) => void;
};

export default function SwipeDeck({ cards, onSave }: SwipeDeckProps) {
  return (
    <Swiper
      cards={cards}
      renderCard={(card) => card ? <TrailerCard {...card} /> : null}
      onSwipedRight={(i) => {
        const anime = cards[i];
        if (anime && onSave) onSave(anime);
      }}
      onSwipedLeft={(i) => console.log('Skipped:', cards[i]?.title)}
      stackSize={3}
      backgroundColor="transparent"
    />
  );
}