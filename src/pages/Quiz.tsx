import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuiz } from '../contexts/QuizContext';
import { useDemo } from '../contexts/DemoContext';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Smile,
  Frown,
  Meh,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

interface Question {
  id: number;
  optionA: string;
  optionB: string;
  dimensions: {
    [key: string]: {
      a: number;
      b: number;
    };
  };
}

const questions: Question[] = [
  {
    id: 1,
    optionA: "Go skydiving",
    optionB: "Learn a musical instrument",
    dimensions: {
      adventure: { a: 10, b: 2 },
      creativity: { a: 2, b: 10 },
      budget: { a: 8, b: 5 },
      time: { a: 2, b: 8 }
    }
  },
  {
    id: 2,
    optionA: "Solo travel to India",
    optionB: "Host a neighbourhood BBQ",
    dimensions: {
      travel: { a: 10, b: 0 },
      sociability: { a: 5, b: 10 },
      budget: { a: 8, b: 4 },
      accessibility: { a: 6, b: 9 }
    }
  },
  {
    id: 3,
    optionA: "Learn to surf",
    optionB: "Start a book club",
    dimensions: {
      adventure: { a: 8, b: 2 },
      sociability: { a: 4, b: 9 },
      creativity: { a: 4, b: 7 },
      accessibility: { a: 7, b: 10 }
    }
  },
  {
    id: 4,
    optionA: "Climb Mount Kilimanjaro",
    optionB: "Master gourmet cooking",
    dimensions: {
      adventure: { a: 10, b: 3 },
      creativity: { a: 3, b: 9 },
      budget: { a: 9, b: 6 },
      time: { a: 7, b: 5 }
    }
  },
  {
    id: 5,
    optionA: "Start a YouTube channel",
    optionB: "Run a marathon",
    dimensions: {
      creativity: { a: 9, b: 3 },
      sociability: { a: 7, b: 4 },
      time: { a: 8, b: 8 },
      accessibility: { a: 9, b: 7 }
    }
  },
  {
    id: 6,
    optionA: "Learn to dance salsa",
    optionB: "Build a treehouse",
    dimensions: {
      sociability: { a: 9, b: 3 },
      creativity: { a: 6, b: 8 },
      accessibility: { a: 8, b: 6 },
      time: { a: 6, b: 7 }
    }
  },
  {
    id: 7,
    optionA: "Volunteer abroad",
    optionB: "Start a home garden",
    dimensions: {
      travel: { a: 9, b: 0 },
      sociability: { a: 8, b: 4 },
      budget: { a: 7, b: 4 },
      accessibility: { a: 6, b: 9 }
    }
  },
  {
    id: 8,
    optionA: "Learn to scuba dive",
    optionB: "Write a novel",
    dimensions: {
      adventure: { a: 9, b: 3 },
      creativity: { a: 4, b: 10 },
      budget: { a: 7, b: 2 },
      time: { a: 5, b: 9 }
    }
  },
  {
    id: 9,
    optionA: "Start a local sports team",
    optionB: "Learn photography",
    dimensions: {
      sociability: { a: 10, b: 4 },
      creativity: { a: 4, b: 9 },
      accessibility: { a: 8, b: 9 },
      time: { a: 7, b: 6 }
    }
  },
  {
    id: 10,
    optionA: "Go on a wildlife safari",
    optionB: "Learn to paint",
    dimensions: {
      adventure: { a: 8, b: 2 },
      creativity: { a: 5, b: 10 },
      budget: { a: 9, b: 4 },
      accessibility: { a: 6, b: 9 }
    }
  }
];

export default function Quiz() {
  const navigate = useNavigate();
  const { setScores } = useQuiz();
  const { isDemoMode, demoUser } = useDemo();
  const [step, setStep] = useState(1);
  const [riskTolerance, setRiskTolerance] = useState(5);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<('A' | 'B')[]>([]);
  const [loading, setLoading] = useState(false);

  const calculateScores = () => {
    const scores = {
      risk_tolerance: riskTolerance,
      adventure: 0,
      creativity: 0,
      sociability: 0,
      travel: 0,
      budget: 0,
      time: 0,
      accessibility: 0
    };

    answers.forEach((answer, index) => {
      const question = questions[index];
      Object.entries(question.dimensions).forEach(([dimension, values]) => {
        scores[dimension as keyof typeof scores] += answer === 'A' ? values.a : values.b;
      });
    });

    // Normalize scores to 0-100
    Object.keys(scores).forEach(key => {
      if (key !== 'risk_tolerance') {
        scores[key as keyof typeof scores] = Math.round((scores[key as keyof typeof scores] / (10 * answers.length)) * 100);
      }
    });

    return scores;
  };

  const handleAnswer = async (answer: 'A' | 'B') => {
    const newAnswers = [...answers, answer];
    setAnswers(newAnswers);

    if (newAnswers.length === questions.length) {
      setLoading(true);
      const finalScores = calculateScores();
      
      try {
        // In demo mode, just store scores in context
        if (isDemoMode) {
          setScores(finalScores);
          navigate('/suggested-list');
          return;
        }

        // For real users, save to database
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.id) {
          console.warn('No user ID found - storing scores locally');
          setScores(finalScores);
          navigate('/suggested-list');
          return;
        }

        const { error } = await supabase
          .from('user_quiz_scores')
          .upsert({
            user_id: user.id,
            ...finalScores
          });

        if (error) throw error;
        setScores(finalScores);
        navigate('/suggested-list');
      } catch (err) {
        console.error('Error saving quiz scores:', err);
        // Continue to suggested list even if save fails
        setScores(finalScores);
        navigate('/suggested-list');
      } finally {
        setLoading(false);
      }
    } else {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const getRiskToleranceEmoji = () => {
    if (riskTolerance <= 3) return <Frown className="h-8 w-8 text-red-500" />;
    if (riskTolerance <= 7) return <Meh className="h-8 w-8 text-yellow-500" />;
    return <Smile className="h-8 w-8 text-green-500" />;
  };

  const getProgressWidth = () => {
    if (step === 1) return '50%';
    return `${((currentQuestion + 1) / questions.length) * 50 + 50}%`;
  };

  const currentQuestionData = questions[currentQuestion];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="mb-8">
          <div className="h-2 bg-gray-200 rounded-full">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-300"
              style={{ width: getProgressWidth() }}
            />
          </div>
          <div className="mt-2 text-sm text-gray-600">
            Step {step} of 2: {step === 1 ? 'Risk Tolerance' : 'Activity Preferences'}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="risk-tolerance"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-xl shadow-lg p-8"
            >
              <h2 className="text-2xl font-bold mb-6">How adventurous are you?</h2>
              <div className="flex items-center justify-center mb-8">
                {getRiskToleranceEmoji()}
              </div>
              <input
                type="range"
                min="0"
                max="10"
                value={riskTolerance}
                onChange={(e) => setRiskTolerance(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between mt-2 text-sm text-gray-600">
                <span>Cautious</span>
                <span>Balanced</span>
                <span>Fearless</span>
              </div>
              <button
                onClick={() => setStep(2)}
                className="mt-8 w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Continue
                <ArrowRight className="h-5 w-5" />
              </button>
            </motion.div>
          ) : currentQuestionData ? (
            <motion.div
              key="questions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-xl shadow-lg p-8"
            >
              <h2 className="text-2xl font-bold mb-6">
                Which would you rather do?
              </h2>
              <div className="grid gap-4">
                <button
                  onClick={() => handleAnswer('A')}
                  className="p-6 text-left border-2 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  {currentQuestionData.optionA}
                </button>
                <button
                  onClick={() => handleAnswer('B')}
                  className="p-6 text-left border-2 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  {currentQuestionData.optionB}
                </button>
              </div>
              <div className="flex justify-between items-center mt-8">
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft className="h-5 w-5" />
                  Back
                </button>
                <div className="flex items-center gap-2">
                  {Array.from({ length: questions.length }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full ${
                        i === currentQuestion
                          ? 'bg-blue-600'
                          : i < currentQuestion
                          ? 'bg-green-500'
                          : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-8 flex items-center gap-4">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              <span>Analyzing your preferences...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}