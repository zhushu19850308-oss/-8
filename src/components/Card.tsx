import React from 'react';
import { CardData, Suit } from '../types';
import { motion } from 'motion/react';

interface CardProps {
  card: CardData;
  isFaceUp?: boolean;
  onClick?: () => void;
  isPlayable?: boolean;
  className?: string;
}

const SUIT_SYMBOLS: Record<Suit, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

const SUIT_COLORS: Record<Suit, string> = {
  hearts: 'text-red-600',
  diamonds: 'text-red-600',
  clubs: 'text-slate-900',
  spades: 'text-slate-900',
};

export const Card: React.FC<CardProps> = ({ 
  card, 
  isFaceUp = true, 
  onClick, 
  isPlayable = false,
  className = ""
}) => {
  return (
    <motion.div
      layout
      initial={{ scale: 0.8, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      whileHover={isPlayable ? { y: -15, scale: 1.05, rotate: -2 } : {}}
      whileTap={isPlayable ? { scale: 0.95 } : {}}
      onClick={isPlayable ? onClick : undefined}
      className={`
        relative w-24 h-36 sm:w-28 sm:h-40 rounded-xl shadow-xl border-2 
        flex flex-col items-center justify-center cursor-pointer select-none
        transition-all duration-300
        ${isFaceUp ? 'bg-white border-slate-200' : 'bg-gradient-to-br from-indigo-600 to-indigo-800 border-indigo-400'}
        ${isPlayable ? 'ring-4 ring-emerald-400/50 border-emerald-500 shadow-emerald-500/20' : ''}
        ${!isPlayable && isFaceUp ? 'grayscale-[0.3] opacity-90' : ''}
        ${className}
      `}
    >
      {isFaceUp ? (
        <>
          <div className={`absolute top-2 left-2 text-lg font-bold leading-none ${SUIT_COLORS[card.suit]}`}>
            {card.rank}
          </div>
          <div className={`text-5xl drop-shadow-sm ${SUIT_COLORS[card.suit]}`}>
            {SUIT_SYMBOLS[card.suit]}
          </div>
          <div className={`absolute bottom-2 right-2 text-lg font-bold leading-none rotate-180 ${SUIT_COLORS[card.suit]}`}>
            {card.rank}
          </div>
          {/* Subtle texture */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')]" />
        </>
      ) : (
        <div className="w-full h-full flex items-center justify-center p-2">
          <div className="w-full h-full border-2 border-white/20 rounded-lg flex items-center justify-center bg-white/5 overflow-hidden relative">
            <div className="text-white/20 text-4xl font-black italic tracking-tighter rotate-[-35deg] scale-150">LEO</div>
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent" />
          </div>
        </div>
      )}
    </motion.div>
  );
};
