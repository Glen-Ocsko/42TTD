import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { Calendar, Loader2 } from 'lucide-react';
import BookingForm from './BookingForm';

interface BookingButtonProps {
  supplierId: string;
  adId?: string;
  activityId?: string;
  adTitle?: string;
  activityTitle?: string;
  price: number;
  currency: string;
  buttonText?: string;
  buttonClassName?: string;
  iconOnly?: boolean;
}

export default function BookingButton({
  supplierId,
  adId,
  activityId,
  adTitle,
  activityTitle,
  price,
  currency,
  buttonText = 'Book Now',
  buttonClassName = 'flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700',
  iconOnly = false
}: BookingButtonProps) {
  const { isAuthenticated } = useCurrentUser();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleClick = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { returnTo: window.location.pathname } });
      return;
    }

    setShowForm(true);
  };

  const handleSuccess = () => {
    setShowForm(false);
    // Show success toast
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50';
    toast.textContent = 'Booking request sent successfully!';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  return (
    <>
      <button
        onClick={handleClick}
        disabled={loading}
        className={buttonClassName}
      >
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Calendar className="h-5 w-5" />
        )}
        {!iconOnly && <span>{buttonText}</span>}
      </button>

      {showForm && (
        <BookingForm
          supplierId={supplierId}
          adId={adId}
          activityId={activityId}
          adTitle={adTitle}
          activityTitle={activityTitle}
          price={price}
          currency={currency}
          onSuccess={handleSuccess}
          onCancel={() => setShowForm(false)}
        />
      )}
    </>
  );
}