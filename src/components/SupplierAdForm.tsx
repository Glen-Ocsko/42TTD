import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { SupplierAdFormData } from '../types/supplier';
import {
  FileText,
  Image,
  MapPin,
  Tag,
  ExternalLink,
  Percent,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Plus,
  X,
  Link as LinkIcon,
  Layers
} from 'lucide-react';

interface SupplierAdFormProps {
  supplierId: string;
  onSubmitSuccess?: () => void;
  initialData?: SupplierAdFormData;
  isEditing?: boolean;
}

export default function SupplierAdForm({
  supplierId,
  onSubmitSuccess,
  initialData,
  isEditing = false
}: SupplierAdFormProps) {
  const [formData, setFormData] = useState<SupplierAdFormData>({
    title: '',
    description: '',
    image_url: '',
    cta_label: 'Learn More',
    cta_link: '',
    activity_tags: [],
    linked_activities: [],
    linked_categories: [],
    location: '',
    highlight_discount: false,
    member_discount: {
      all: '0%',
      premium: '0%',
      pro: '0%'
    }
  });
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [availableActivities, setAvailableActivities] = useState<{id: string, title: string}[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [activityInput, setActivityInput] = useState('');
  const [activitySearchResults, setActivitySearchResults] = useState<{id: string, title: string}[]>([]);
  const [showActivityResults, setShowActivityResults] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
    loadActivityTags();
    loadActivities();
    loadCategories();
  }, [initialData]);

  const loadActivityTags = async () => {
    try {
      const { data, error } = await supabase
        .from('activities')
        .select('category_tags')
        .not('category_tags', 'is', null);

      if (error) throw error;

      // Extract unique tags from all activities
      const allTags = data.flatMap(activity => activity.category_tags || []);
      const uniqueTags = [...new Set(allTags)].sort();
      setAvailableTags(uniqueTags);
    } catch (err) {
      console.error('Error loading activity tags:', err);
    }
  };

  const loadActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('activities')
        .select('id, title')
        .order('title');

      if (error) throw error;
      setAvailableActivities(data || []);
    } catch (err) {
      console.error('Error loading activities:', err);
    }
  };

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('activity_categories')
        .select('name')
        .order('name');

      if (error) throw error;
      setAvailableCategories(data.map(cat => cat.name) || []);
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleDiscountChange = (tier: 'all' | 'premium' | 'pro', value: string) => {
    // Remove non-numeric characters and ensure it ends with %
    let formattedValue = value.replace(/[^0-9]/g, '');
    formattedValue = formattedValue ? `${formattedValue}%` : '0%';
    
    setFormData(prev => ({
      ...prev,
      member_discount: {
        ...prev.member_discount,
        [tier]: formattedValue
      }
    }));
  };

  const addTag = () => {
    if (!tagInput.trim()) return;
    
    if (!formData.activity_tags.includes(tagInput)) {
      setFormData(prev => ({
        ...prev,
        activity_tags: [...prev.activity_tags, tagInput]
      }));
    }
    
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      activity_tags: prev.activity_tags.filter(t => t !== tag)
    }));
  };

  const searchActivities = (query: string) => {
    if (!query.trim()) {
      setActivitySearchResults([]);
      return;
    }
    
    const results = availableActivities.filter(activity => 
      activity.title.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 5);
    
    setActivitySearchResults(results);
    setShowActivityResults(true);
  };

  const addActivity = (activity: {id: string, title: string}) => {
    if (!formData.linked_activities.includes(activity.title)) {
      setFormData(prev => ({
        ...prev,
        linked_activities: [...prev.linked_activities, activity.title]
      }));
    }
    
    setActivityInput('');
    setActivitySearchResults([]);
    setShowActivityResults(false);
  };

  const removeActivity = (activity: string) => {
    setFormData(prev => ({
      ...prev,
      linked_activities: prev.linked_activities.filter(a => a !== activity)
    }));
  };

  const toggleCategory = (category: string) => {
    setFormData(prev => {
      if (prev.linked_categories.includes(category)) {
        return {
          ...prev,
          linked_categories: prev.linked_categories.filter(c => c !== category)
        };
      } else {
        return {
          ...prev,
          linked_categories: [...prev.linked_categories, category]
        };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setSubmitting(true);
    setError('');
    setSuccess(false);

    try {
      // Validate website URL format
      if (formData.cta_link && !formData.cta_link.startsWith('http')) {
        formData.cta_link = `https://${formData.cta_link}`;
      }

      if (isEditing) {
        // Update existing ad
        const { error: updateError } = await supabase
          .from('supplier_ads')
          .update({
            ...formData,
            supplier_id: supplierId,
            approved: false, // Reset approval status on edit
            updated_at: new Date().toISOString()
          })
          .eq('id', initialData?.id);

        if (updateError) throw updateError;
      } else {
        // Create new ad
        const { error: insertError } = await supabase
          .from('supplier_ads')
          .insert({
            ...formData,
            supplier_id: supplierId
          });

        if (insertError) throw insertError;
      }

      setSuccess(true);
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
    } catch (err) {
      console.error('Error submitting ad form:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit form');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-lg">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 text-green-600 bg-green-50 p-4 rounded-lg">
          <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
          <p>
            {isEditing 
              ? 'Your ad has been updated and is pending approval.' 
              : 'Your ad has been submitted and is pending approval.'}
          </p>
        </div>
      )}

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          Ad Title
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Catchy title for your advertisement"
          required
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <div className="relative">
          <FileText className="absolute left-3 top-3 text-gray-400" />
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            className="pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Describe what you're offering"
            required
          />
        </div>
      </div>

      <div>
        <label htmlFor="image_url" className="block text-sm font-medium text-gray-700 mb-1">
          Image URL
        </label>
        <div className="relative">
          <Image className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="url"
            id="image_url"
            name="image_url"
            value={formData.image_url}
            onChange={handleChange}
            className="pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="https://example.com/image.jpg"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="cta_label" className="block text-sm font-medium text-gray-700 mb-1">
            Button Label
          </label>
          <input
            type="text"
            id="cta_label"
            name="cta_label"
            value={formData.cta_label}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Book Now, Learn More, etc."
            required
          />
        </div>

        <div>
          <label htmlFor="cta_link" className="block text-sm font-medium text-gray-700 mb-1">
            Button Link
          </label>
          <div className="relative">
            <ExternalLink className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              id="cta_link"
              name="cta_link"
              value={formData.cta_link}
              onChange={handleChange}
              className="pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://example.com/offer"
              required
            />
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
          Location
        </label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            className="pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="City, Country"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Link to Specific Activities
        </label>
        <div className="mb-2">
          <div className="flex flex-wrap gap-2 mb-2">
            {formData.linked_activities.map(activity => (
              <div key={activity} className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                <span>{activity}</span>
                <button 
                  type="button" 
                  onClick={() => removeActivity(activity)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
          <div className="relative">
            <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={activityInput}
              onChange={(e) => {
                setActivityInput(e.target.value);
                searchActivities(e.target.value);
              }}
              onFocus={() => {
                if (activityInput) searchActivities(activityInput);
                setShowActivityResults(true);
              }}
              onBlur={() => {
                // Delay hiding to allow for clicks
                setTimeout(() => setShowActivityResults(false), 200);
              }}
              className="pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Search for activities to link"
            />
            {showActivityResults && activitySearchResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {activitySearchResults.map(activity => (
                  <button
                    key={activity.id}
                    type="button"
                    onClick={() => addActivity(activity)}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50"
                  >
                    {activity.title}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <p className="text-xs text-gray-500">
          Link your ad to specific activities to ensure it's shown to the right audience.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Link to Categories
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-2">
          {availableCategories.map(category => (
            <label key={category} className="flex items-center gap-2 p-2 border rounded hover:bg-gray-50">
              <input
                type="checkbox"
                checked={formData.linked_categories.includes(category)}
                onChange={() => toggleCategory(category)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm">{category}</span>
            </label>
          ))}
        </div>
        <p className="text-xs text-gray-500">
          Link your ad to broader categories to reach more potential customers.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Activity Tags
        </label>
        <div className="mb-2">
          <div className="flex flex-wrap gap-2 mb-2">
            {formData.activity_tags.map(tag => (
              <div key={tag} className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                <span>{tag}</span>
                <button 
                  type="button" 
                  onClick={() => removeTag(tag)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Add a tag"
                list="available-tags"
              />
              <datalist id="available-tags">
                {availableTags.map(tag => (
                  <option key={tag} value={tag} />
                ))}
              </datalist>
            </div>
            <button
              type="button"
              onClick={addTag}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
        </div>
        <p className="text-xs text-gray-500">
          Add tags that match activities in our system to ensure your ad is shown to the right audience.
        </p>
      </div>

      <div>
        <div className="flex items-center mb-4">
          <input
            type="checkbox"
            id="highlight_discount"
            name="highlight_discount"
            checked={formData.highlight_discount}
            onChange={handleCheckboxChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="highlight_discount" className="ml-2 block text-sm text-gray-700">
            Offer member discounts
          </label>
        </div>

        {formData.highlight_discount && (
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-700">Member Discounts</h4>
            
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                All Members
              </label>
              <div className="relative">
                <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={formData.member_discount.all}
                  onChange={(e) => handleDiscountChange('all', e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0%"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Premium Members
              </label>
              <div className="relative">
                <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={formData.member_discount.premium}
                  onChange={(e) => handleDiscountChange('premium', e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0%"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Pro Members
              </label>
              <div className="relative">
                <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={formData.member_discount.pro}
                  onChange={(e) => handleDiscountChange('pro', e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0%"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {submitting ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Submitting...
          </>
        ) : (
          isEditing ? 'Update Advertisement' : 'Submit Advertisement'
        )}
      </button>
    </form>
  );
}