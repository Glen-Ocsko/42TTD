import React, { createContext, useContext, useState } from 'react';

interface QuizScores {
  risk_tolerance: number;
  adventure: number;
  creativity: number;
  sociability: number;
  travel: number;
  budget: number;
  time: number;
  accessibility: number;
}

interface QuizContextType {
  scores: QuizScores | null;
  setScores: (scores: QuizScores) => void;
  clearScores: () => void;
}

const QuizContext = createContext<QuizContextType | undefined>(undefined);

export function QuizProvider({ children }: { children: React.ReactNode }) {
  const [scores, setScores] = useState<QuizScores | null>(null);

  const clearScores = () => {
    setScores(null);
  };

  return (
    <QuizContext.Provider value={{ scores, setScores, clearScores }}>
      {children}
    </QuizContext.Provider>
  );
}

export function useQuiz() {
  const context = useContext(QuizContext);
  if (context === undefined) {
    throw new Error('useQuiz must be used within a QuizProvider');
  }
  return context;
}