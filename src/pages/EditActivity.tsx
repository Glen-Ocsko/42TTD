import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { supabase } from '../lib/supabase';
import { 
  Save, 
  Image as ImageIcon, 
  Tag, 
  Globe, 
  Users, 
  Lock, 
  CheckCircle2, 
  Loader2, 
  AlertTriangle,
  ArrowLeft,
  Upload,
  Eye,
  X,
  AlertCircle
} from 'lucide-react';

interface Category {
  id: string;
  name: string;
}

interface ActivityFormData {
  title: string;
  display_title: string;
  description: string;
  category_tags: string[];
  image_url: string;
  visibility: 'public' | 'friends' | 'private';
  propose_for_main_list: boolean;
}

export default function EditActivity() {
  const { id } = useParams<{ id: string }>();
  const { userId, isAuthenticated } = useCurrentUser();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<ActivityFormData>({
    title: '',
    display_title: '',
    description: '',
    category_tags: [],
    image_url: '',
    visibility: 'public',
    propose_for_main_list: false
  });
  
  const [originalActivity, setOriginalActivity] = useState<any>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [wasSubmittedForReview, setWasSubmittedForReview] = useState(false);
  const [isApproved, setIsApproved] = useState(false);

  useEffect(() => {
    // Redirect if not logged in
    if (!isAuthenticated) {
      navigate('/login', { state: { returnTo: `/edit-activity/${id}` } });
      return;
    }
    
    loadActivity();
    loadCategories();
  }, [isAuthenticated, id, navigate]);

  const loadActivity = async () => {
    try {
      if (!id) {
        navigate('/dashboard');
        return;
      }

      const { data, error } = await supabase
        .from('custom_activities')
        .select('*, activity_posts(visibility)')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (error) {
        throw error;
      }

      if (!data) {
        setError('Activity not found or you do not have permission to edit it');
        return;
      }

      // Check if activity is already approved
      if (data.moderation_status === 'approved' && data.proposed_for_main_list) {
        setIsApproved(true);
      }

      // Set the original activity data
      setOriginalActivity(data);
      
      // Set the form data
      setFormData({
        title: data.title || '',
        display_title: data.display_title || '',
        description: data.description || '',
        category_tags: data.category_tags || [],
        image_url: data.image_url || '',
        visibility: data.activity_posts?.[0]?.visibility || 'public',
        propose_for_main_list: data.proposed_for_main_list || false
      });

      // Track if it was submitted for review
      setWasSubmittedForReview(data.proposed_for_main_list);
      
      // Set image preview if there's an image URL
      if (data.image_url) {
        setImagePreview(data.image_url);
      }
    } catch (err) {
      console.error('Error loading activity:', err);
      setError('Failed to load activity');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('activity_categories')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error('Error loading categories:', err);
      setError('Failed to load categories');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const options = e.target.options;
    const selectedCategories: string[] = [];
    
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selectedCategories.push(options[i].value);
      }
    }
    
    setFormData(prev => ({ ...prev, category_tags: selectedCategories }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      setError('File must be an image');
      return;
    }
    
    setUploadingImage(true);
    setError('');
    
    try {
      // Create a preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `custom-activities/${userId}/${fileName}`;
      
      const { error: uploadError, data } = await supabase.storage
        .from('activity-images')
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;
      
      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('activity-images')
        .getPublicUrl(filePath);
      
      setFormData(prev => ({ ...prev, image_url: publicUrl }));
    } catch (err) {
      console.error('Error uploading image:', err);
      setError('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.title) {
      setError('Title is required');
      return;
    }
    
    if (!formData.description) {
      setError('Description is required');
      return;
    }
    
    if (formData.category_tags.length === 0) {
      setError('At least one category is required');
      return;
    }
    
    setSubmitting(true);
    setError('');
    
    try {
      // Update the custom activity
      const { error: updateError } = await supabase
        .from('custom_activities')
        .update({
          title: formData.title,
          display_title: formData.display_title || formData.title,
          description: formData.description,
          category_tags: formData.category_tags,
          proposed_for_main_list: formData.propose_for_main_list,
          // If it was previously submitted for review but now isn't, or if it was rejected and is being resubmitted
          moderation_status: wasSubmittedForReview && !formData.propose_for_main_list ? 
                            null : 
                            (originalActivity?.moderation_status === 'rejected' && formData.propose_for_main_list) ? 
                            'pending' : 
                            originalActivity?.moderation_status
        })
        .eq('id', id);
      
      if (updateError) throw updateError;
      
      // Update the associated post
      if (originalActivity?.activity_posts?.length > 0) {
        const postId = originalActivity.activity_posts[0].id;
        
        const { error: postError } = await supabase
          .from('activity_posts')
          .update({
            content: `I've updated "${formData.display_title || formData.title}" in my list! ${formData.description}`,
            image_url: formData.image_url || null,
            visibility: formData.visibility
          })
          .eq('id', postId);
        
        if (postError) throw postError;
      }
      
      // Show success toast
      const toast = document.createElement('div');
      toast.className = 'fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      toast.textContent = 'Activity updated successfully!';
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
      
      // Redirect to dashboard
      navigate('/dashboard');
    } catch (err) {
      console.error('Error updating activity:', err);
      setError('Failed to update activity');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (isApproved) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Dashboard
        </button>
        
        <div className="bg-blue-50 p-8 rounded-xl text-center">
          <CheckCircle2 className="h-16 w-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">This Activity Cannot Be Edited</h1>
          <p className="text-lg text-gray-700 mb-6">
            This activity has been approved and is now part of the official 42 Things To Do list.
            Approved activities cannot be modified.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button
        onClick={() => navigate('/dashboard')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="h-5 w-5" />
        Back to Dashboard
      </button>
      
      <div className="bg-white rounded-xl shadow-sm p-6 md:p-8">
        <h1 className="text-3xl font-bold mb-6">Edit Activity</h1>
        
        {error && (
          <div className="mb-6 flex items-center gap-2 bg-red-50 text-red-600 p-4 rounded-lg">
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}
        
        {wasSubmittedForReview && originalActivity?.moderation_status === 'pending' && (
          <div className="mb-6 flex items-center gap-2 bg-amber-50 text-amber-600 p-4 rounded-lg">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p>This activity is currently under review. Making changes will remove it from the review queue, and you'll need to resubmit it.</p>
          </div>
        )}
        
        {originalActivity?.moderation_status === 'requested_changes' && (
          <div className="mb-6 flex items-start gap-2 bg-blue-50 text-blue-600 p-4 rounded-lg">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Changes Requested</p>
              <p className="mt-1">{originalActivity.moderator_notes}</p>
              <p className="mt-2 text-sm">Please make the requested changes and resubmit your activity.</p>
            </div>
          </div>
        )}
        
        {originalActivity?.moderation_status === 'rejected' && (
          <div className="mb-6 flex items-start gap-2 bg-red-50 text-red-600 p-4 rounded-lg">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Activity Rejected</p>
              <p className="mt-1">{originalActivity.moderator_notes}</p>
              <p className="mt-2 text-sm">You can make changes and resubmit your activity for review.</p>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Skydiving, Learn Spanish"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                This is used for sorting and identification
              </p>
            </div>
            
            <div>
              <label htmlFor="display_title" className="block text-sm font-medium text-gray-700 mb-1">
                Display Title
              </label>
              <input
                type="text"
                id="display_title"
                name="display_title"
                value={formData.display_title}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Go Skydiving, Learn Spanish"
              />
              <p className="text-xs text-gray-500 mt-1">
                How the activity will appear on cards
              </p>
            </div>
          </div>
          
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe this activity..."
              required
            />
          </div>
          
          <div>
            <label htmlFor="category_tags" className="block text-sm font-medium text-gray-700 mb-1">
              Categories <span className="text-red-500">*</span>
            </label>
            <select
              id="category_tags"
              name="category_tags"
              multiple
              value={formData.category_tags}
              onChange={handleCategoryChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              size={5}
            >
              {categories.map(category => (
                <option key={category.id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Hold Ctrl/Cmd to select multiple categories
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Image (optional)
            </label>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    name="image_url"
                    value={formData.image_url}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Image URL"
                  />
                  <span className="text-gray-500">or</span>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                    disabled={uploadingImage}
                  >
                    {uploadingImage ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Upload className="h-5 w-5" />
                    )}
                    Upload
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    className="hidden"
                    accept="image/*"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  If no image is provided, a random one will be shown based on the selected categories
                </p>
              </div>
              
              {(imagePreview || formData.image_url) && (
                <div className="w-full md:w-32 h-32 relative rounded-lg overflow-hidden border">
                  <img
                    src={imagePreview || formData.image_url}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview(null);
                      setFormData(prev => ({ ...prev, image_url: '' }));
                    }}
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Visibility <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name="visibility"
                  value="public"
                  checked={formData.visibility === 'public'}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <div className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-gray-500" />
                  <div>
                    <div className="font-medium">Public</div>
                    <div className="text-sm text-gray-500">Everyone can see this activity</div>
                  </div>
                </div>
              </label>
              
              <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name="visibility"
                  value="friends"
                  checked={formData.visibility === 'friends'}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-gray-500" />
                  <div>
                    <div className="font-medium">Friends Only</div>
                    <div className="text-sm text-gray-500">Only mutual followers can see this activity</div>
                  </div>
                </div>
              </label>
              
              <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name="visibility"
                  value="private"
                  checked={formData.visibility === 'private'}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <div className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-gray-500" />
                  <div>
                    <div className="font-medium">Private</div>
                    <div className="text-sm text-gray-500">Only you can see this activity</div>
                  </div>
                </div>
              </label>
            </div>
          </div>
          
          <div className="space-y-3 pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="propose_for_main_list"
                checked={formData.propose_for_main_list}
                onChange={handleCheckboxChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span>Submit this activity for review to be included in the public 42TTD list</span>
            </label>
          </div>
          
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? (
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
        </form>
      </div>
      
      {/* Preview Section */}
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Preview</h2>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Eye className="h-5 w-5 text-blue-600" />
            <h3 className="font-medium">How your activity will appear</h3>
          </div>
          
          <div className="max-w-sm mx-auto">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {(imagePreview || formData.image_url) ? (
                <img
                  src={imagePreview || formData.image_url}
                  alt="Activity preview"
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                  <ImageIcon className="h-12 w-12 text-gray-400" />
                </div>
              )}
              
              <div className="p-4">
                <h3 className="text-lg font-bold">
                  {formData.display_title || formData.title || 'Activity Title'}
                </h3>
                
                <p className="text-gray-600 text-sm mt-2 line-clamp-2">
                  {formData.description || 'Activity description will appear here...'}
                </p>
                
                <div className="flex flex-wrap gap-2 mt-3">
                  {formData.category_tags.length > 0 ? (
                    formData.category_tags.map((tag) => (
                      <span
                        key={tag}
                        className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
                      >
                        <Tag className="h-3 w-3" />
                        {tag}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-400 text-xs">No categories selected</span>
                  )}
                </div>
                
                <div className="flex items-center gap-2 mt-4">
                  {formData.visibility === 'public' && <Globe className="h-4 w-4 text-gray-500" />}
                  {formData.visibility === 'friends' && <Users className="h-4 w-4 text-gray-500" />}
                  {formData.visibility === 'private' && <Lock className="h-4 w-4 text-gray-500" />}
                  <span className="text-sm text-gray-500 capitalize">{formData.visibility}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}