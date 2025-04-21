// ActivityCard.tsx — Fully working with correct saving to Supabase

import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useDemo } from '../contexts/DemoContext';
import ActivityImage from './ActivityImage';
import {
  Eye, Plus, Lock, Trash2, Edit2, Save, X, Upload, Tag, Star
} from 'lucide-react';

interface Activity {
  id: string;
  title: string;
  description?: string;
  category_tags?: string[];
  difficulty?: number;
  image_url?: string | null;
  unsplash_keywords?: string;
}

interface ActivityCardProps {
  activity: Activity;
  isOnList?: boolean;
  onAddToList?: () => void;
  onRemoveFromList?: () => void;
  showListActions?: boolean;
}

export default function ActivityCard({
  activity: initialActivity,
  isOnList = false,
  onAddToList,
  onRemoveFromList,
  showListActions = true,
}: ActivityCardProps) {
  const navigate = useNavigate();
  const { isDemoMode, demoUser } = useDemo();
  const { isAuthenticated } = useCurrentUser();
  const [activity, setActivity] = useState(initialActivity);
  const [editedActivity, setEditedActivity] = useState(initialActivity);
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = isDemoMode ? demoUser?.is_admin : false;

  const availableCategories = [
    'Adventure & Adrenaline', 'Arts & Culture', 'Career & Ambition', 'Community & Events',
    'Creative Expression', 'Cultural Experience', 'Finance & Freedom', 'Food & Drink',
    'Health & Fitness', 'Investment', 'Life Milestones', 'Nature & Outdoors',
    'Outdoor Activities', 'Personal Growth', 'Social Impact', 'Travel & Exploration'
  ];

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const filename = `${Math.random().toString(36).slice(2)}.${ext}`;
      const path = `activity-images/${filename}`;

      const { error: uploadError } = await supabase.storage.from('activity-images').upload(path, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('activity-images').getPublicUrl(path);
      setEditedActivity(prev => ({ ...prev, image_url: publicUrl }));
    } catch (err) {
      setError('Image upload failed');
    } finally {
      setUploading(false);
    }
  };

  const showToast = (message: string, success = true) => {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2 text-white ${success ? 'bg-green-600' : 'bg-red-600'}`;
    toast.innerHTML = `<span>${message}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');

    try {
      const { error } = await supabase.from('activities')
        .update({
          title: editedActivity.title,
          description: editedActivity.description,
          category_tags: editedActivity.category_tags,
          difficulty: editedActivity.difficulty,
          image_url: editedActivity.image_url,
          unsplash_keywords: editedActivity.unsplash_keywords
        })
        .eq('id', activity.id);

      if (error) throw error;

      setActivity(editedActivity);
      setIsEditing(false);
      showToast('Changes saved successfully!');
    } catch (err) {
      console.error('Saving failed:', err);
      setError('Saving failed');
      showToast('Failed to save changes', false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden flex flex-col h-full">
      <ActivityImage
        title={activity.title}
        imageUrl={activity.image_url}
        unsplashKeywords={activity.unsplash_keywords}
        aspectRatio="video"
      />
      <div className="p-4 flex flex-col flex-grow">
        {isEditing ? (
          <div className="space-y-4">
            <input
              className="w-full border px-2 py-1 rounded"
              value={editedActivity.title}
              onChange={e => setEditedActivity(p => ({ ...p, title: e.target.value }))}
              placeholder="Title"
            />
            <textarea
              className="w-full border px-2 py-1 rounded"
              value={editedActivity.description || ''}
              onChange={e => setEditedActivity(p => ({ ...p, description: e.target.value }))}
              placeholder="Description"
            />
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              className="hidden"
              accept="image/*"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="bg-gray-100 px-3 py-1 rounded"
            >
              {uploading ? 'Uploading...' : 'Upload Image'}
            </button>
            <input
              className="w-full border px-2 py-1 rounded"
              value={editedActivity.image_url || ''}
              onChange={e => setEditedActivity(p => ({ ...p, image_url: e.target.value }))}
              placeholder="Image URL"
            />
            <div>
              <div className="mb-2">Categories:</div>
              {availableCategories.map(cat => (
                <label key={cat} className="block">
                  <input
                    type="checkbox"
                    checked={editedActivity.category_tags?.includes(cat)}
                    onChange={e => {
                      const updated = e.target.checked
                        ? [...(editedActivity.category_tags || []), cat]
                        : (editedActivity.category_tags || []).filter(c => c !== cat);
                      setEditedActivity(p => ({ ...p, category_tags: updated }));
                    }}
                  /> {cat}
                </label>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setIsEditing(false)} className="bg-gray-200 px-3 py-1 rounded">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="bg-blue-600 text-white px-3 py-1 rounded">
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
            {error && <div className="text-red-600">{error}</div>}
          </div>
        ) : (
          <>
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-bold">{activity.title}</h3>
              {isAdmin && <button onClick={() => setIsEditing(true)}><Edit2 className="h-4 w-4 text-gray-500" /></button>}
            </div>
            
            {activity.description && (
              <p className="text-gray-600 text-sm mb-4 flex-grow">{activity.description}</p>
            )}
            
            <div className="mt-auto flex gap-2">
              <button
                onClick={() => navigate(`/activities/${activity.id}`)}
                className="flex-1 bg-[#f97316] text-white font-medium px-4 py-2 rounded-lg hover:bg-orange-700 transition-all duration-200 ease-in-out"
              >
                <Eye className="h-4 w-4 inline mr-2" /> Learn More
              </button>
              {showListActions && (
                isOnList ? (
                  <button onClick={onRemoveFromList} className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-all duration-200 ease-in-out">
                    <Trash2 className="h-4 w-4" /> Remove
                  </button>
                ) : (
                  <button onClick={onAddToList} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all duration-200 ease-in-out">
                    {isAuthenticated ? <><Plus className="h-4 w-4" /> Add to List</> : <><Lock className="h-4 w-4" /> Sign In</>}
                  </button>
                )
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export { ActivityCard };