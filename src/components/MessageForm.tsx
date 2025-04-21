import React, { useState } from 'react';
import { Loader2, Send } from 'lucide-react';

interface MessageFormProps {
  receiverId: string;
  adId?: string;
  activityId?: string;
  onSubmit: (messageText: string) => void;
  isSubmitting?: boolean;
  placeholder?: string;
  buttonText?: string;
  initialMessage?: string;
}

export default function MessageForm({
  receiverId,
  adId,
  activityId,
  onSubmit,
  isSubmitting = false,
  placeholder = 'Type your message here...',
  buttonText = 'Send Message',
  initialMessage = ''
}: MessageFormProps) {
  const [messageText, setMessageText] = useState(initialMessage);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageText.trim() && !isSubmitting) {
      onSubmit(messageText.trim());
      setMessageText('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <textarea
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          rows={4}
          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder={placeholder}
          required
          disabled={isSubmitting}
        />
        <div className="text-xs text-gray-500 mt-1">
          {1000 - messageText.length} characters remaining
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting || !messageText.trim()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="h-5 w-5" />
              {buttonText}
            </>
          )}
        </button>
      </div>
    </form>
  );
}