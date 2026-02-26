export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface CardData {
  id: string;
  suit: Suit;
  rank: Rank;
}

export type GameStatus = 'waiting' | 'playing' | 'suit_picking' | 'game_over' | 'start_screen';

export interface GameState {
  deck: CardData[];
  discardPile: CardData[];
  playerHand: CardData[];
  aiHand: CardData[];
  currentPlayer: 'player' | 'ai';
  status: GameStatus;
  winner: 'player' | 'ai' | null;
  activeSuit: Suit | null; // For Crazy 8s
}
