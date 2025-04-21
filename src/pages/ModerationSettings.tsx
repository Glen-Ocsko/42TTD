import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { CannedResponse, DEFAULT_CANNED_RESPONSES } from '../types/moderation';
import { 
  Shield, 
  Loader2, 
  AlertTriangle, 
  Save, 
  Plus, 
  Trash2, 
  Edit2, 
  X, 
  CheckCircle2
} from 'lucide-react';
import { Dialog } from '@headlessui/react';

export default function ModerationSettings() {
  const { userId, isAuthenticated } = useCurrentUser();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModerator, setIsModerator] = useState(false);
  const [cannedResponses, setCannedResponses] = useState<CannedResponse[]>(DEFAULT_CANNED_RESPONSES);
  const [editingResponse, setEditingResponse] = useState<CannedResponse | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    checkModeratorStatus();
  }, [isAuthenticated, userId]);

  const checkModeratorStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_moderator, is_admin')
        .eq('id', userId)
        .single();

      if (error) throw error;
      
      if (!data.is_moderator && !data.is_admin) {
        navigate('/');
        return;
      }
      
      setIsModerator(true);
      setLoading(false);
    } catch (err) {
      console.error('Error checking moderator status:', err);
      setError('Failed to verify moderator status');
      navigate('/');
    }
  };

  const handleEditResponse = (response: CannedResponse) => {
    setEditingResponse(response);
    setShowEditModal(true);
  };

  const handleAddResponse = () => {
    const newResponse: CannedResponse = {
      id: `new-${Date.now()}`,
      title: '',
      message: '',
      action_type: 'warning'
    };
    setEditingResponse(newResponse);
    setShowEditModal(true);
  };

  const handleDeleteResponse = (id: string) => {
    setCannedResponses(prev => prev.filter(r => r.id !== id));
  };

  const handleSaveResponse = () => {
    if (!editingResponse || !editingResponse.title || !editingResponse.message) return;
    
    setSaving(true);
    
    try {
      // Update existing response or add new one
      setCannedResponses(prev => {
        const index = prev.findIndex(r => r.id === editingResponse!.id);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = editingResponse!;
          return updated;
        } else {
          return [...prev, editingResponse!];
        }
      });
      
      setSaveSuccess(true);
      
      // Close modal after success
      setTimeout(() => {
        setShowEditModal(false);
        setEditingResponse(null);
        setSaveSuccess(false);
      }, 1500);
    } catch (err) {
      console.error('Error saving response:', err);
      setError('Failed to save response');
    } finally {
      setSaving(false);
    }
  };

  if (!isModerator) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="h-8 w-8 text-blue-600" />
        <h1 className="text-3xl font-bold">Moderation Settings</h1>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            <p>{error}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-8">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-bold">Canned Responses</h2>
          <button
            onClick={handleAddResponse}
            className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            <Plus className="h-4 w-4" />
            Add Response
          </button>
        </div>
        
        <div className="p-4">
          <p className="text-gray-600 mb-4">
            These templates are used when taking moderation actions. You can customize them to fit your community guidelines.
          </p>
          
          <div className="space-y-4">
            {cannedResponses.map((response) => (
              <div key={response.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">{response.title}</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEditResponse(response)}
                      className="p-1 text-gray-500 hover:text-blue-600"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteResponse(response.id)}
                      className="p-1 text-gray-500 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                <div className="text-sm text-gray-500 mb-2">
                  Used for: {response.action_type.replace('_', ' ')}
                </div>
                
                <p className="text-gray-700 text-sm whitespace-pre-wrap">
                  {response.message}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Edit Response Modal */}
      <Dialog
        open={showEditModal}
        onClose={() => {
          if (!saving && !saveSuccess) {
            setShowEditModal(false);
            setEditingResponse(null);
          }
        }}
        className="fixed inset-0 z-10 overflow-y-auto"
      >
        <div className="flex items-center justify-center min-h-screen">
          <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />

          <div className="relative bg-white rounded-lg max-w-md w-full mx-4 p-6">
            {saveSuccess ? (
              <div className="text-center py-6">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="mt-3 text-lg font-medium text-gray-900">Response Saved</h3>
                <p className="mt-2 text-sm text-gray-500">
                  Your canned response has been saved successfully.
                </p>
              </div>
            ) : (
              <>
                <Dialog.Title className="text-lg font-bold mb-4 flex items-center justify-between">
                  <span>{editingResponse?.id.startsWith('new-') ? 'Add Response' : 'Edit Response'}</span>
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingResponse(null);
                    }}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </Dialog.Title>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      value={editingResponse?.title || ''}
                      onChange={(e) => setEditingResponse(prev => prev ? { ...prev, title: e.target.value } : null)}
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Response title"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Action Type
                    </label>
                    <select
                      value={editingResponse?.action_type || 'warning'}
                      onChange={(e) => setEditingResponse(prev => prev ? { ...prev, action_type: e.target.value as any } : null)}
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="warning">Warning</option>
                      <option value="post_removal">Post Removal</option>
                      <option value="suspension">Suspension</option>
                      <option value="ban">Ban</option>
                      <option value="report_dismissed">Report Dismissed</option>
                      <option value="report_resolved">Report Resolved</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Message
                    </label>
                    <textarea
                      value={editingResponse?.message || ''}
                      onChange={(e) => setEditingResponse(prev => prev ? { ...prev, message: e.target.value } : null)}
                      rows={6}
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Message content"
                      required
                    />
                  </div>

                  <button
                    onClick={handleSaveResponse}
                    disabled={saving || !editingResponse?.title || !editingResponse?.message}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Save className="h-5 w-5" />
                    )}
                    Save Response
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </Dialog>
    </div>
  );
}