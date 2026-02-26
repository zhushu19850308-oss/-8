import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CardData, GameState, Suit } from './types';
import { createDeck, isPlayable, SUITS } from './gameLogic';
import { Card } from './components/Card';
import { Trophy, RotateCcw, Info, ChevronRight, Hash } from 'lucide-react';

const INITIAL_HAND_SIZE = 8;

export default function App() {
  const [state, setState] = useState<GameState>({
    deck: [],
    discardPile: [],
    playerHand: [],
    aiHand: [],
    currentPlayer: 'player',
    status: 'start_screen',
    winner: null,
    activeSuit: null,
  });

  const [showSuitPicker, setShowSuitPicker] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [pendingCard, setPendingCard] = useState<CardData | null>(null);
  const [message, setMessage] = useState("准备好开始 Leo 疯狂 8 点了吗？");

  const initGame = () => {
    const fullDeck = createDeck();
    const playerHand = fullDeck.splice(0, INITIAL_HAND_SIZE);
    const aiHand = fullDeck.splice(0, INITIAL_HAND_SIZE);
    const firstDiscard = fullDeck.pop()!;
    
    setState({
      deck: fullDeck,
      discardPile: [firstDiscard],
      playerHand,
      aiHand,
      currentPlayer: 'player',
      status: 'playing',
      winner: null,
      activeSuit: null,
    });
    setMessage("你的回合！请匹配花色或点数。");
  };

  useEffect(() => {
    initGame();
  }, []);

  useEffect(() => {
    if (state.status === 'playing' && state.currentPlayer === 'ai') {
      const timer = setTimeout(() => {
        aiMove(state);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [state.currentPlayer, state.status]);

  const checkWinner = (newState: GameState): GameState => {
    if (newState.playerHand.length === 0) {
      return { ...newState, status: 'game_over' as const, winner: 'player' as const };
    }
    if (newState.aiHand.length === 0) {
      return { ...newState, status: 'game_over' as const, winner: 'ai' as const };
    }
    return newState;
  };

  const nextTurn = (currentState: GameState): GameState => {
    const nextPlayer: 'player' | 'ai' = currentState.currentPlayer === 'player' ? 'ai' : 'player';
    const newState: GameState = { ...currentState, currentPlayer: nextPlayer };
    
    if (nextPlayer === 'ai') {
      setMessage("AI 正在思考...");
    } else {
      setMessage("到你了！");
    }
    
    return newState;
  };

  const playCard = (card: CardData, isPlayer: boolean, chosenSuit?: Suit) => {
    setState(prev => {
      const handKey = isPlayer ? 'playerHand' : 'aiHand';
      const newHand = prev[handKey].filter(c => c.id !== card.id);
      const newDiscard = [...prev.discardPile, card];
      const isEight = card.rank === '8';
      
      let newState: GameState = {
        ...prev,
        [handKey]: newHand,
        discardPile: newDiscard,
        activeSuit: isEight ? (chosenSuit || null) : null,
      };

      newState = checkWinner(newState);
      
      if (newState.status === 'game_over') {
        setMessage(newState.winner === 'player' ? "你赢了！ 🎉" : "AI 赢了！ 🤖");
        return newState;
      }

      return nextTurn(newState);
    });
  };

  const handlePlayerCardClick = (card: CardData) => {
    if (state.currentPlayer !== 'player' || state.status !== 'playing') return;
    
    if (isPlayable(card, state.discardPile[state.discardPile.length - 1], state.activeSuit)) {
      if (card.rank === '8') {
        setPendingCard(card);
        setShowSuitPicker(true);
      } else {
        playCard(card, true);
      }
    }
  };

  const handleSuitSelect = (suit: Suit) => {
    if (pendingCard) {
      playCard(pendingCard, true, suit);
      setPendingCard(null);
      setShowSuitPicker(false);
    }
  };

  const drawCard = (isPlayer: boolean) => {
    setState(prev => {
      if (prev.deck.length === 0) {
        setMessage("牌堆已空！跳过回合。");
        return nextTurn(prev);
      }

      const newDeck = [...prev.deck];
      const drawnCard = newDeck.pop()!;
      const handKey = isPlayer ? 'playerHand' : 'aiHand';
      const newHand = [...prev[handKey], drawnCard];

      const newState: GameState = {
        ...prev,
        deck: newDeck,
        [handKey]: newHand,
      };

      setMessage(isPlayer ? "你摸了一张牌。" : "AI 摸了一张牌。");
      return nextTurn(newState);
    });
  };

  const aiMove = (currentState: GameState) => {
    const topCard = currentState.discardPile[currentState.discardPile.length - 1];
    const playableCards = currentState.aiHand.filter(c => isPlayable(c, topCard, currentState.activeSuit));

    if (playableCards.length > 0) {
      // AI Strategy: Play an 8 only if necessary, or pick a suit it has most of
      const nonEight = playableCards.find(c => c.rank !== '8');
      const cardToPlay = nonEight || playableCards[0];

      if (cardToPlay.rank === '8') {
        // Pick suit AI has most of
        const suitCounts: Record<Suit, number> = { hearts: 0, diamonds: 0, clubs: 0, spades: 0 };
        currentState.aiHand.forEach(c => suitCounts[c.suit]++);
        const bestSuit = (Object.keys(suitCounts) as Suit[]).reduce((a, b) => suitCounts[a] > suitCounts[b] ? a : b);
        playCard(cardToPlay, false, bestSuit);
        setMessage(`AI 出了一个 8 并选择了 ${bestSuit === 'hearts' ? '红心' : bestSuit === 'diamonds' ? '方块' : bestSuit === 'clubs' ? '梅花' : '黑桃'}！`);
      } else {
        playCard(cardToPlay, false);
        const suitName = cardToPlay.suit === 'hearts' ? '红心' : cardToPlay.suit === 'diamonds' ? '方块' : cardToPlay.suit === 'clubs' ? '梅花' : '黑桃';
        setMessage(`AI 出了 ${suitName} ${cardToPlay.rank}。`);
      }
    } else {
      drawCard(false);
    }
  };

  const topDiscard = state.discardPile[state.discardPile.length - 1];

  return (
    <div className="min-h-screen bg-[#0f111a] text-slate-100 font-sans selection:bg-emerald-500/30 overflow-hidden">
      {/* Header */}
      <header className="p-4 flex justify-between items-center border-b border-white/5 bg-black/40 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Hash className="text-white" size={24} />
          </div>
          <h1 className="text-xl font-black tracking-tighter uppercase italic">Leo 疯狂 8 点</h1>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowRules(true)}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors text-slate-400 hover:text-white"
            title="游戏规则"
          >
            <Info size={20} />
          </button>
          <button 
            onClick={initGame}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors text-slate-400 hover:text-white"
            title="重新开始"
          >
            <RotateCcw size={20} />
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 flex flex-col gap-8 min-h-[calc(100vh-80px)] relative">
        {state.status === 'start_screen' ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-8">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative"
            >
              <div className="absolute -inset-4 bg-emerald-500/20 blur-3xl rounded-full" />
              <h2 className="text-6xl sm:text-8xl font-black tracking-tighter italic uppercase mb-4 relative">
                LEO <span className="text-emerald-500">8</span>
              </h2>
              <p className="text-slate-400 max-w-md mx-auto">
                顶级纸牌竞技体验。匹配花色，运用 8 点万能牌，击败智能 AI。
              </p>
            </motion.div>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={initGame}
              className="px-12 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-black rounded-2xl shadow-xl shadow-emerald-500/20 transition-all flex items-center gap-3 text-xl"
            >
              开始游戏 <ChevronRight size={24} />
            </motion.button>
          </div>
        ) : (
          <>
            {/* AI Hand */}
            <div className="flex flex-col items-center gap-2">
              <div className="text-[10px] uppercase tracking-[0.3em] text-slate-500 font-black mb-2 flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${state.currentPlayer === 'ai' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-700'}`} />
                AI 对手 • {state.aiHand.length} 张牌
              </div>
              <div className="flex flex-wrap justify-center gap-[-40px] px-8">
                {state.aiHand.map((card, idx) => (
                  <div key={card.id} style={{ marginLeft: idx === 0 ? 0 : -70 }} className="transition-all hover:z-10">
                    <Card card={card} isFaceUp={false} className="scale-90 opacity-80" />
                  </div>
                ))}
              </div>
            </div>

            {/* Center Table */}
            <div className="flex-1 flex flex-col items-center justify-center gap-8 py-8 relative">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-md text-center">
                <motion.div 
                  key={message}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/5 border border-white/10 rounded-2xl px-6 py-3 text-sm font-bold inline-block backdrop-blur-md"
                >
                  {message}
                </motion.div>
              </div>

              <div className="flex items-center gap-12 sm:gap-32">
                {/* Draw Pile */}
                <div className="flex flex-col items-center gap-4">
                  <div className="relative group">
                    <Card 
                      card={{} as any} 
                      isFaceUp={false} 
                      onClick={() => state.currentPlayer === 'player' && drawCard(true)}
                      isPlayable={state.currentPlayer === 'player' && state.status === 'playing'}
                      className="shadow-2xl shadow-indigo-500/40"
                    />
                    <div className="absolute -bottom-3 -right-3 bg-indigo-500 text-white text-xs font-black px-3 py-1 rounded-xl shadow-xl border-2 border-[#0f111a]">
                      {state.deck.length}
                    </div>
                  </div>
                  <span className="text-[10px] uppercase tracking-widest text-slate-600 font-black">摸牌堆</span>
                </div>

                {/* Discard Pile */}
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <AnimatePresence mode="popLayout">
                      <motion.div
                        key={topDiscard?.id}
                        initial={{ x: 150, opacity: 0, rotate: 45 }}
                        animate={{ x: 0, opacity: 1, rotate: 0 }}
                        transition={{ type: 'spring', damping: 15, stiffness: 100 }}
                      >
                        {topDiscard && <Card card={topDiscard} />}
                      </motion.div>
                    </AnimatePresence>
                    
                    {state.activeSuit && (
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-6 -right-6 w-12 h-12 bg-white rounded-2xl shadow-2xl flex items-center justify-center border-4 border-emerald-500 text-3xl z-20"
                      >
                        {state.activeSuit === 'hearts' && '♥'}
                        {state.activeSuit === 'diamonds' && '♦'}
                        {state.activeSuit === 'clubs' && '♣'}
                        {state.activeSuit === 'spades' && '♠'}
                      </motion.div>
                    )}
                  </div>
                  <span className="text-[10px] uppercase tracking-widest text-slate-600 font-black">弃牌堆</span>
                </div>
              </div>
            </div>

            {/* Player Hand */}
            <div className="flex flex-col items-center gap-4 pb-12">
              <div className="text-[10px] uppercase tracking-[0.3em] text-slate-500 font-black flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${state.currentPlayer === 'player' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-700'}`} />
                你的手牌 • {state.playerHand.length} 张牌
              </div>
              <div className="flex flex-wrap justify-center gap-3 px-4 max-w-5xl">
                {state.playerHand.map((card) => (
                  <Card 
                    key={card.id} 
                    card={card} 
                    onClick={() => handlePlayerCardClick(card)}
                    isPlayable={state.currentPlayer === 'player' && isPlayable(card, topDiscard, state.activeSuit)}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </main>

      {/* Rules Overlay */}
      <AnimatePresence>
        {showRules && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#1a1c2c] border border-white/10 p-8 rounded-[32px] shadow-2xl max-w-lg w-full relative"
            >
              <button 
                onClick={() => setShowRules(false)}
                className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors"
              >
                <RotateCcw size={24} className="rotate-45" />
              </button>
              <h2 className="text-3xl font-black mb-6 tracking-tighter uppercase italic">游戏规则</h2>
              <div className="space-y-4 text-slate-300 text-sm leading-relaxed">
                <p><strong className="text-emerald-500">发牌：</strong> 每位玩家初始分发 8 张牌。</p>
                <p><strong className="text-emerald-500">出牌：</strong> 你出的牌必须在“花色”或“点数”上与弃牌堆最顶部的牌匹配。</p>
                <p><strong className="text-emerald-500">万能 8 点：</strong> 数字“8”是万用牌。你可以在任何时候打出 8，并指定一个新的花色。</p>
                <p><strong className="text-emerald-500">摸牌：</strong> 如果无牌可出，必须从摸牌堆摸一张牌。如果摸牌堆为空，则跳过该回合。</p>
                <p><strong className="text-emerald-500">获胜：</strong> 最先清空手牌的一方获胜。</p>
              </div>
              <button
                onClick={() => setShowRules(false)}
                className="w-full mt-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl font-bold transition-all"
              >
                了解
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Suit Picker Modal */}
      <AnimatePresence>
        {showSuitPicker && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#24273a] border border-white/10 p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center"
            >
              <h2 className="text-2xl font-bold mb-2">疯狂 8 点！</h2>
              <p className="text-slate-400 text-sm mb-8">请选择一个新的花色继续游戏</p>
              <div className="grid grid-cols-2 gap-4">
                {SUITS.map(suit => (
                  <button
                    key={suit}
                    onClick={() => handleSuitSelect(suit)}
                    className="p-6 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all group"
                  >
                    <div className={`text-4xl mb-2 group-hover:scale-125 transition-transform ${suit === 'hearts' || suit === 'diamonds' ? 'text-red-500' : 'text-slate-200'}`}>
                      {suit === 'hearts' && '♥'}
                      {suit === 'diamonds' && '♦'}
                      {suit === 'clubs' && '♣'}
                      {suit === 'spades' && '♠'}
                    </div>
                    <div className="text-[10px] uppercase tracking-widest font-bold opacity-50">{suit === 'hearts' ? '红心' : suit === 'diamonds' ? '方块' : suit === 'clubs' ? '梅花' : '黑桃'}</div>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Game Over Modal */}
      <AnimatePresence>
        {state.status === 'game_over' && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="bg-[#24273a] border border-white/10 p-12 rounded-[40px] shadow-2xl max-w-md w-full text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500" />
              <div className="mb-6 inline-flex items-center justify-center w-20 h-20 bg-emerald-500/10 rounded-full text-emerald-500">
                <Trophy size={40} />
              </div>
              <h2 className="text-4xl font-black mb-2 tracking-tight">
                {state.winner === 'player' ? '胜利！' : '失败'}
              </h2>
              <p className="text-slate-400 mb-10">
                {state.winner === 'player' 
                  ? '你清空了手牌，赢得了比赛！' 
                  : 'AI 这次更快。下次好运！'}
              </p>
              <button
                onClick={initGame}
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-2xl transition-all flex items-center justify-center gap-2 group"
              >
                <RotateCcw size={20} className="group-hover:rotate-180 transition-transform duration-500" />
                再玩一次
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer Info */}
      <footer className="p-6 text-center text-[10px] uppercase tracking-[0.2em] text-slate-600 font-bold">
        Leo 疯狂八点 • 使用 React & Tailwind 构建
      </footer>
    </div>
  );
}
