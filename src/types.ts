import { CardOrientation, TarotCard, TarotSpread } from './data/tarotCards';

export type TarotScreen = 
  | 'spread_selection' 
  | 'choose_cards' 
  | 'fate_awaits' 
  | 'reveal' 
  | 'chat';

export interface DrawnCard {
  card: TarotCard;
  orientation: CardOrientation;
  isUpright: boolean;
  positionIndex: number; // 0-based index
  positionName: string; // From SPREADS configurations
  positionDesc: string; // Position definition
}

export interface ChatMessage {
  id: string;
  role: 'ai' | 'user';
  text: string;
  timestamp: string;
}
