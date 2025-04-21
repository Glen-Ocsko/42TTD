import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Check, 
  Loader2, 
  AlertTriangle,
  Download,
  Users
} from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isWeekend, parseISO } from 'date-fns';

interface SupplierCalendarProps {
  supplierId: string;
}

interface DateAvailability {
  date: string;
  available: boolean;
  has_bookings: boolean;
  note?: string;
}

interface Booking {
  id: string;
  user_name: string;
  user_email: string;
  date: string;
  booking_time: string | null;
  status: string;
  price_total: number;
  currency: string;
  ad_title?: string;
  activity_title?: string;
}

export default function SupplierCalendar({ supplierId }: SupplierCalendarProps) {
  const { userId } = useCurrentUser();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [availability, setAvailability] = useState<DateAvailability[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (supplierId) {
      loadAvailability();
    }
  }, [supplierId, currentMonth]);

  useEffect(() => {
    if (selectedDate) {
      loadBookingsForDate(selectedDate);
    }
  }, [selectedDate]);

  const loadAvailability = async () => {
    try {
      setLoading(true);
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);
      
      const { data, error } = await supabase.rpc('get_supplier_available_dates', {
        supplier_id: supplierId,
        start_date: format(start, 'yyyy-MM-dd'),
        end_date: format(end, 'yyyy-MM-dd')
      });
      
      if (error) throw error;
      
      // Get notes for dates
      const { data: notesData, error: notesError } = await supabase
        .from('supplier_availability')
        .select('date, note')
        .eq('supplier_id', supplierId)
        .gte('date', format(start, 'yyyy-MM-dd'))
        .lte('date', format(end, 'yyyy-MM-dd'));
      
      if (notesError) throw notesError;
      
      // Combine availability with notes
      const availabilityWithNotes = data?.map(item => {
        const noteEntry = notesData?.find(note => note.date === item.date);
        return {
          ...item,
          note: noteEntry?.note
        };
      }) || [];
      
      setAvailability(availabilityWithNotes);
    } catch (err) {
      console.error('Error loading availability:', err);
      setError('Failed to load availability');
    } finally {
      setLoading(false);
    }
  };

  const loadBookingsForDate = async (date: string) => {
    try {
      setLoadingBookings(true);
      
      const { data, error } = await supabase.rpc('get_supplier_bookings', {
        supplier_id: supplierId,
        status_filter: null
      });
      
      if (error) throw error;
      
      // Filter bookings for selected date
      const dateBookings = data?.filter(booking => booking.date === date) || [];
      setBookings(dateBookings);
      
      // Get note for this date
      const dateAvailability = availability.find(a => a.date === date);
      setNote(dateAvailability?.note || '');
    } catch (err) {
      console.error('Error loading bookings:', err);
      setError('Failed to load bookings');
    } finally {
      setLoadingBookings(false);
    }
  };

  const toggleDateAvailability = async (date: string) => {
    try {
      setSaving(true);
      
      const currentAvailability = availability.find(a => a.date === date);
      const isCurrentlyAvailable = currentAvailability?.available !== false;
      
      // Update or insert availability
      const { error } = await supabase
        .from('supplier_availability')
        .upsert({
          supplier_id: supplierId,
          date: date,
          available: !isCurrentlyAvailable,
          note: currentAvailability?.note || ''
        });
      
      if (error) throw error;
      
      // Update local state
      setAvailability(prev => 
        prev.map(a => 
          a.date === date 
            ? { ...a, available: !isCurrentlyAvailable } 
            : a
        )
      );
    } catch (err) {
      console.error('Error updating availability:', err);
      setError('Failed to update availability');
    } finally {
      setSaving(false);
    }
  };

  const saveNote = async () => {
    if (!selectedDate) return;
    
    try {
      setSaving(true);
      
      const currentAvailability = availability.find(a => a.date === selectedDate);
      const isCurrentlyAvailable = currentAvailability?.available !== false;
      
      // Update or insert availability with note
      const { error } = await supabase
        .from('supplier_availability')
        .upsert({
          supplier_id: supplierId,
          date: selectedDate,
          available: isCurrentlyAvailable,
          note: note
        });
      
      if (error) throw error;
      
      // Update local state
      setAvailability(prev => 
        prev.map(a => 
          a.date === selectedDate 
            ? { ...a, note: note } 
            : a
        )
      );
      
      // Show success toast
      const toast = document.createElement('div');
      toast.className = 'fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      toast.textContent = 'Note saved successfully!';
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
    } catch (err) {
      console.error('Error saving note:', err);
      setError('Failed to save note');
    } finally {
      setSaving(false);
    }
  };

  const exportBookings = () => {
    // Create CSV content
    const headers = ['Date', 'Time', 'Customer', 'Email', 'Activity', 'Status', 'Price', 'Currency'];
    const rows = bookings.map(booking => [
      booking.date,
      booking.booking_time || 'N/A',
      booking.user_name,
      booking.user_email,
      booking.ad_title || booking.activity_title || 'N/A',
      booking.status,
      booking.price_total,
      booking.currency
    ]);
    
    // Convert to CSV string
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `bookings-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const getDaysInMonth = () => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  };

  const getDateAvailability = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return availability.find(a => a.date === dateStr);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 p-4">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <p>{error}</p>
          <button
            onClick={() => setError('')}
            className="ml-auto text-red-600 hover:text-red-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-blue-600" />
          Availability Calendar
        </h2>
        
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="p-1 rounded-full hover:bg-gray-100"
          >
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          </button>
          <span className="font-medium">
            {format(currentMonth, 'MMMM yyyy')}
          </span>
          <button
            onClick={nextMonth}
            className="p-1 rounded-full hover:bg-gray-100"
          >
            <ChevronRight className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-px bg-gray-200">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="bg-gray-100 p-2 text-center text-sm font-medium">
            {day}
          </div>
        ))}
        
        {getDaysInMonth().map(date => {
          const dateStr = format(date, 'yyyy-MM-dd');
          const dateAvailability = getDateAvailability(date);
          const isAvailable = dateAvailability?.available !== false;
          const hasBookings = dateAvailability?.has_bookings || false;
          const isSelected = selectedDate === dateStr;
          const hasNote = dateAvailability?.note && dateAvailability.note.length > 0;
          
          return (
            <button
              key={dateStr}
              onClick={() => setSelectedDate(dateStr)}
              className={`
                relative bg-white p-2 h-20 text-left transition-colors
                ${isWeekend(date) ? 'bg-gray-50' : ''}
                ${isSelected ? 'ring-2 ring-blue-500' : ''}
                ${!isAvailable ? 'bg-red-50' : ''}
                ${hasBookings ? 'bg-yellow-50' : ''}
              `}
            >
              <div className="font-medium">{format(date, 'd')}</div>
              
              {!isAvailable && (
                <div className="absolute top-1 right-1">
                  <X className="h-4 w-4 text-red-500" />
                </div>
              )}
              
              {hasBookings && (
                <div className="absolute bottom-1 right-1 flex items-center gap-1 text-xs text-yellow-600">
                  <Users className="h-3 w-3" />
                </div>
              )}
              
              {hasNote && (
                <div className="absolute bottom-1 left-1 w-2 h-2 bg-blue-500 rounded-full"></div>
              )}
            </button>
          );
        })}
      </div>
      
      {selectedDate && (
        <div className="p-4 border-t">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium">
              {format(parseISO(selectedDate), 'EEEE, MMMM d, yyyy')}
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => toggleDateAvailability(selectedDate)}
                disabled={saving}
                className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm ${
                  availability.find(a => a.date === selectedDate)?.available !== false
                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : availability.find(a => a.date === selectedDate)?.available !== false ? (
                  <X className="h-4 w-4" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                {availability.find(a => a.date === selectedDate)?.available !== false
                  ? 'Mark as Unavailable'
                  : 'Mark as Available'}
              </button>
              
              {bookings.length > 0 && (
                <button
                  onClick={exportBookings}
                  className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200"
                >
                  <Download className="h-4 w-4" />
                  Export
                </button>
              )}
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes for this date
            </label>
            <div className="flex gap-2">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Add notes about this date..."
              />
              <button
                onClick={saveNote}
                disabled={saving}
                className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  'Save'
                )}
              </button>
            </div>
          </div>
          
          <h4 className="font-medium mb-2">Bookings for this date</h4>
          {loadingBookings ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              No bookings for this date
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.map(booking => (
                <div key={booking.id} className="border rounded-lg p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{booking.user_name}</div>
                      <div className="text-sm text-gray-600">{booking.user_email}</div>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                      booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </div>
                  </div>
                  
                  <div className="mt-2 text-sm">
                    <div>
                      <span className="font-medium">Time:</span> {booking.booking_time || 'Not specified'}
                    </div>
                    <div>
                      <span className="font-medium">Activity:</span> {booking.ad_title || booking.activity_title || 'Not specified'}
                    </div>
                    <div>
                      <span className="font-medium">Price:</span> {new Intl.NumberFormat('en-GB', { style: 'currency', currency: booking.currency }).format(booking.price_total)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}