import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { supabase } from '../lib/supabase';
import { MessageSquare, Loader2, X } from 'lucide-react';
import { Dialog } from '@headlessui/react';

interface MessageSupplierButtonProps {
  supplierId: string;
  adId?: string;
  activityId?: string;
  adTitle?: string;
  activityTitle?: string;
  buttonText?: string;
  buttonClassName?: string;
  iconOnly?: boolean;
}

export default function MessageSupplierButton({
  supplierId,
  adId,
  activityId,
  adTitle,
  activityTitle,
  buttonText = 'Message Supplier',
  buttonClassName = 'flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700',
  iconOnly = false
}: MessageSupplierButtonProps) {
  const { userId, isAuthenticated } = useCurrentUser();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleClick = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { returnTo: window.location.pathname } });
      return;
    }

    setShowModal(true);
  };

  const handleSend = async () => {
    if (!message.trim()) {
      setError('Please enter a message');
      return;
    }

    setSending(true);
    setError('');

    try {
      const { error: sendError } = await supabase
        .from('messages')
        .insert({
          sender_id: userId,
          receiver_id: supplierId,
          ad_id: adId,
          activity_id: activityId,
          message_text: message.trim()
        });

      if (sendError) throw sendError;

      setSuccess(true);
      setMessage('');

      // Close modal after a delay
      setTimeout(() => {
        setShowModal(false);
        setSuccess(false);
      }, 2000);
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        className={buttonClassName}
      >
        <MessageSquare className="h-5 w-5" />
        {!iconOnly && <span>{buttonText}</span>}
      </button>

      <Dialog
        open={showModal}
        onClose={() => setShowModal(false)}
        className="fixed inset-0 z-10 overflow-y-auto"
      >
        <div className="flex items-center justify-center min-h-screen">
          <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />

          <div className="relative bg-white rounded-lg max-w-md w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <Dialog.Title className="text-lg font-medium">
                {success ? 'Message Sent' : 'Send Message'}
              </Dialog.Title>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {success ? (
              <div className="text-center py-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-lg font-medium text-gray-900 mb-1">Message Sent!</p>
                <p className="text-gray-500">
                  The supplier will respond to your message soon.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {(adTitle || activityTitle) && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-600">
                      Regarding: <span className="font-medium">{adTitle || activityTitle}</span>
                    </p>
                  </div>
                )}

                {error && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Your Message
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Type your message here..."
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={sending || !message.trim()}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {sending ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      'Send Message'
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Dialog>
    </>
  );
}