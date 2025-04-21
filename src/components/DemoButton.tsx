import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TestTube } from 'lucide-react';
import { useDemo } from '../contexts/DemoContext';

export default function DemoButton() {
  const navigate = useNavigate();
  const { enableDemoMode } = useDemo();

  const handleDemoLogin = () => {
    enableDemoMode();
    navigate('/dashboard');
  };

  return (
    <button
      onClick={handleDemoLogin}
      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
    >
      <TestTube className="h-5 w-5" />
      Enter as Demo User
    </button>
  );
}