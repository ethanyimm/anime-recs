export type AnimeCard = {
  id: number;
  title: string;
  genres?: string[];
  year?: number | string;
  synopsis?: string;
  trailerId?: string | null;
};