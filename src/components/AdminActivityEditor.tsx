// AdminActivityEditor.tsx — Clean admin panel to edit any activity directly and reliably

import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Save } from 'lucide-react';

interface Activity {
  id: string;
  title: string;
  display_title?: string;
  description?: string;
  difficulty?: number;
  image_url?: string;
  unsplash_keywords?: string;
  category_tags?: string[];
}

export default function AdminActivityEditor() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [edited, setEdited] = useState<Partial<Activity>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    supabase.from('activities').select('id, title').then(({ data }) => {
      if (data) setActivities(data);
    });
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    supabase.from('activities').select('*').eq('id', selectedId).single().then(({ data }) => {
      if (data) setEdited(data);
    });
  }, [selectedId]);

  const updateField = (field: keyof Activity, value: any) => {
    setEdited(prev => ({ ...prev, [field]: value }));
  };

  const save = async () => {
    if (!edited.id) return;
    setSaving(true);
    setMessage('');

    const { error } = await supabase.from('activities')
      .update(edited)
      .eq('id', edited.id);

    if (error) {
      setMessage('❌ Failed to save.');
    } else {
      setMessage('✅ Changes saved.');
    }

    setSaving(false);
    setTimeout(() => setMessage(''), 4000);
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Admin Activity Editor</h1>

      <select
        className="w-full border px-3 py-2 rounded"
        value={selectedId}
        onChange={(e) => setSelectedId(e.target.value)}
      >
        <option value="">Select an activity...</option>
        {activities.map(a => (
          <option key={a.id} value={a.id}>{a.title}</option>
        ))}
      </select>

      {selectedId && (
        <div className="space-y-4">
          <input
            className="w-full border px-3 py-2 rounded"
            value={edited.title || ''}
            onChange={(e) => {
              updateField('title', e.target.value);
              // If display_title is empty, update it too
              if (!edited.display_title) {
                updateField('display_title', e.target.value);
              }
            }}
            placeholder="Title"
          />
            
          <div>
            <label htmlFor="display_title" className="block text-sm font-medium text-gray-700 mb-1">
              Display Title
            </label>
            <input
              className="w-full border px-3 py-2 rounded"
              value={edited.display_title || ''}
              onChange={(e) => updateField('display_title', e.target.value)}
              placeholder="User-friendly title (e.g., 'Visit New York', 'Learn to play guitar')"
            />
            <p className="text-xs text-gray-500 mt-1">
              This is how the title will appear to users. If left empty, the original title will be used.
              Sorting will still be based on the original title.
            </p>
          </div>

          <textarea
            className="w-full border px-3 py-2 rounded"
            value={edited.description || ''}
            onChange={(e) => updateField('description', e.target.value)}
            placeholder="Description"
          />

          <input
            className="w-full border px-3 py-2 rounded"
            type="number"
            min={1}
            max={5}
            value={edited.difficulty || ''}
            onChange={(e) => updateField('difficulty', Number(e.target.value))}
            placeholder="Difficulty (1–5)"
          />

          <input
            className="w-full border px-3 py-2 rounded"
            value={edited.image_url || ''}
            onChange={(e) => updateField('image_url', e.target.value)}
            placeholder="Image URL"
          />

          <input
            className="w-full border px-3 py-2 rounded"
            value={edited.unsplash_keywords || ''}
            onChange={(e) => updateField('unsplash_keywords', e.target.value)}
            placeholder="Unsplash Keywords"
          />

          <input
            className="w-full border px-3 py-2 rounded"
            value={(edited.category_tags || []).join(', ')}
            onChange={(e) => updateField('category_tags', e.target.value.split(',').map(tag => tag.trim()))}
            placeholder="Category tags (comma-separated)"
          />

          <button
            onClick={save}
            disabled={saving}
            className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>

          {message && <div className="text-sm mt-2">{message}</div>}
        </div>
      )}
    </div>
  );
}