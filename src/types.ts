export interface Card {
  id: number;
  text: string;
}

export interface AppState {
  cards: Card[];
  currentIndex: number;
  isAnimating: boolean;
}

export interface TouchState {
  startX: number;
  endX: number;
}
