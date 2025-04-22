import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Loader2, 
  AlertTriangle, 
  Edit2, 
  Trash2, 
  Save, 
  Plus, 
  Search,
  CheckCircle2,
  X
} from 'lucide-react';

interface Activity {
  id: string;
  title: string;
  description?: string;
  difficulty?: number;
  image_url?: string;
  unsplash_keywords?: string;
  category_tags?: string[];
  created_at?: string;
}

export default function AdminEditor() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<Activity[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedActivity, setEditedActivity] = useState<Activity | null>(null);

  useEffect(() => {
    loadActivities();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = activities.filter(activity => 
        activity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (activity.description && activity.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredActivities(filtered);
    } else {
      setFilteredActivities(activities);
    }
  }, [searchQuery, activities]);

  const loadActivities = async () => {
    try {
      setLoading(true);
      setError('');
      
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setActivities(data || []);
      setFilteredActivities(data || []);
    } catch (err) {
      console.error('Error loading activities:', err);
      setError('Failed to load activities. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectActivity = (activity: Activity) => {
    setSelectedActivity(activity);
    setEditedActivity(null);
    setIsEditing(false);
  };

  const handleEditActivity = () => {
    if (!selectedActivity) return;
    setEditedActivity({ ...selectedActivity });
    setIsEditing(true);
  };

  const handleSaveActivity = async () => {
    if (!editedActivity) return;
    
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      
      const { error } = await supabase
        .from('activities')
        .update({
          title: editedActivity.title,
          description: editedActivity.description,
          difficulty: editedActivity.difficulty,
          image_url: editedActivity.image_url,
          unsplash_keywords: editedActivity.unsplash_keywords,
          category_tags: editedActivity.category_tags,
        })
        .eq('id', editedActivity.id);
      
      if (error) throw error;
      
      // Update local state
      setActivities(prev => 
        prev.map(activity => 
          activity.id === editedActivity.id ? editedActivity : activity
        )
      );
      
      setSelectedActivity(editedActivity);
      setIsEditing(false);
      setSuccess('Activity updated successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error updating activity:', err);
      setError('Failed to update activity. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteActivity = async () => {
    if (!selectedActivity) return;
    
    if (!window.confirm(`Are you sure you want to delete "${selectedActivity.title}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const { error } = await supabase
        .from('activities')
        .delete()
        .eq('id', selectedActivity.id);
      
      if (error) throw error;
      
      // Update local state
      setActivities(prev => prev.filter(activity => activity.id !== selectedActivity.id));
      setSelectedActivity(null);
      setSuccess('Activity deleted successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error deleting activity:', err);
      setError('Failed to delete activity. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (!editedActivity) return;
    
    const { name, value } = e.target;
    setEditedActivity(prev => {
      if (!prev) return null;
      return { ...prev, [name]: value };
    });
  };

  const handleCategoryTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editedActivity) return;
    
    const tagsString = e.target.value;
    const tagsArray = tagsString.split(',').map(tag => tag.trim()).filter(Boolean);
    
    setEditedActivity(prev => {
      if (!prev) return null;
      return { ...prev, category_tags: tagsArray };
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Activity Management</h1>
      
      {error && (
        <div className="mb-6 flex items-center gap-2 bg-red-50 text-red-600 p-4 rounded-lg">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}
      
      {success && (
        <div className="mb-6 flex items-center gap-2 bg-green-50 text-green-600 p-4 rounded-lg">
          <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
          <p>{success}</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Activities List */}
        <div className="md:col-span-1 bg-white rounded-lg shadow-sm p-4">
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search activities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No activities found
            </div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {filteredActivities.map(activity => (
                <button
                  key={activity.id}
                  onClick={() => handleSelectActivity(activity)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedActivity?.id === activity.id
                      ? 'bg-blue-50 border border-blue-200'
                      : 'hover:bg-gray-50 border border-transparent'
                  }`}
                >
                  <h3 className="font-medium truncate">{activity.title}</h3>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                    <span>ID: {activity.id.substring(0, 8)}...</span>
                    <span>Difficulty: {activity.difficulty || 'N/A'}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* Activity Details */}
        <div className="md:col-span-2 bg-white rounded-lg shadow-sm p-6">
          {selectedActivity && !isEditing ? (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">{selectedActivity.title}</h2>
                <div className="flex gap-2">
                  <button
                    onClick={handleEditActivity}
                    className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Edit2 className="h-4 w-4" />
                    Edit
                  </button>
                  <button
                    onClick={handleDeleteActivity}
                    className="flex items-center gap-2 px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium mb-2">Details</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-gray-500">ID:</span> {selectedActivity.id}
                    </div>
                    <div>
                      <span className="text-gray-500">Difficulty:</span> {selectedActivity.difficulty || 'Not set'}
                    </div>
                    <div>
                      <span className="text-gray-500">Description:</span>
                      <p className="mt-1 text-gray-700 whitespace-pre-wrap">{selectedActivity.description || 'No description'}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">Media & Categories</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-gray-500">Image URL:</span>
                      <div className="mt-1">
                        {selectedActivity.image_url ? (
                          <a 
                            href={selectedActivity.image_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline break-all"
                          >
                            {selectedActivity.image_url}
                          </a>
                        ) : (
                          <span className="text-gray-500">No image URL</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">Unsplash Keywords:</span>
                      <div className="mt-1">
                        {selectedActivity.unsplash_keywords || 'None'}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">Categories:</span>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {selectedActivity.category_tags && selectedActivity.category_tags.length > 0 ? (
                          selectedActivity.category_tags.map(tag => (
                            <span key={tag} className="px-2 py-1 bg-gray-100 rounded-full text-sm">
                              {tag}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-500">No categories</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : isEditing && editedActivity ? (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Edit Activity</h2>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditedActivity(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={editedActivity.title}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={editedActivity.description || ''}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 mb-1">
                    Difficulty (1-5)
                  </label>
                  <input
                    type="number"
                    id="difficulty"
                    name="difficulty"
                    value={editedActivity.difficulty || ''}
                    onChange={handleInputChange}
                    min={1}
                    max={5}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label htmlFor="image_url" className="block text-sm font-medium text-gray-700 mb-1">
                    Image URL
                  </label>
                  <input
                    type="url"
                    id="image_url"
                    name="image_url"
                    value={editedActivity.image_url || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label htmlFor="unsplash_keywords" className="block text-sm font-medium text-gray-700 mb-1">
                    Unsplash Keywords
                  </label>
                  <input
                    type="text"
                    id="unsplash_keywords"
                    name="unsplash_keywords"
                    value={editedActivity.unsplash_keywords || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., nature,mountain,hiking"
                  />
                </div>
                
                <div>
                  <label htmlFor="category_tags" className="block text-sm font-medium text-gray-700 mb-1">
                    Category Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    id="category_tags"
                    name="category_tags"
                    value={editedActivity.category_tags?.join(', ') || ''}
                    onChange={handleCategoryTagsChange}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Adventure & Adrenaline, Outdoor Activities"
                  />
                </div>
                
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setEditedActivity(null);
                    }}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveActivity}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-5 w-5" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <h2 className="text-xl font-medium text-gray-700 mb-4">Select an activity to view or edit</h2>
              <p className="text-gray-500 mb-6">Choose an activity from the list on the left to view its details or make changes.</p>
              <div className="flex justify-center">
                <button
                  onClick={() => {
                    // This would typically open a form to create a new activity
                    // For now, just show a message
                    alert('Create new activity functionality would go here');
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="h-5 w-5" />
                  Create New Activity
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}