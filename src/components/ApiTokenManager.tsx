import React, { useState, useEffect } from 'react';
import { supabase, safeUserQuery } from '../lib/supabase';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { 
  Key, 
  Copy, 
  RefreshCw, 
  Trash2, 
  Loader2, 
  AlertTriangle,
  CheckCircle2,
  Info
} from 'lucide-react';
import { Dialog } from '@headlessui/react';

interface ApiTokenManagerProps {
  supplierId: string;
}

interface ApiToken {
  id: string;
  token: string;
  name: string;
  created_at: string;
  expires_at: string | null;
  last_used_at: string | null;
}

export default function ApiTokenManager({ supplierId }: ApiTokenManagerProps) {
  const { userId } = useCurrentUser();
  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [tokenToDelete, setTokenToDelete] = useState<string | null>(null);
  const [showNewToken, setShowNewToken] = useState(false);
  const [newToken, setNewToken] = useState('');
  const [tokenName, setTokenName] = useState('');

  useEffect(() => {
    if (supplierId) {
      loadTokens();
    }
  }, [supplierId]);

  const loadTokens = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await safeUserQuery(
        async () => {
          return await supabase
            .from('supplier_api_tokens')
            .select('*')
            .eq('supplier_id', supplierId)
            .order('created_at', { ascending: false });
        },
        userId,
        { data: [] }
      );
      
      if (error) throw error;
      setTokens(data || []);
    } catch (err) {
      console.error('Error loading API tokens:', err);
      setError('Failed to load API tokens');
    } finally {
      setLoading(false);
    }
  };

  const generateToken = async () => {
    if (!tokenName.trim()) {
      setError('Please enter a name for your token');
      return;
    }
    
    try {
      setGenerating(true);
      setError('');
      
      // Generate a token on the server
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-api-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          supplierId,
          name: tokenName
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate API token');
      }
      
      const { token: newApiToken } = await response.json();
      
      // Show the new token
      setNewToken(newApiToken);
      setShowNewToken(true);
      setTokenName('');
      
      // Reload tokens
      loadTokens();
    } catch (err) {
      console.error('Error generating API token:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate API token');
    } finally {
      setGenerating(false);
    }
  };

  const deleteToken = async (tokenId: string) => {
    try {
      setDeleting(tokenId);
      
      const { error } = await safeUserQuery(
        async () => {
          return await supabase
            .from('supplier_api_tokens')
            .delete()
            .eq('id', tokenId)
            .eq('supplier_id', supplierId);
        },
        userId
      );
      
      if (error) throw error;
      
      // Reload tokens
      loadTokens();
      setShowConfirmDelete(false);
      setTokenToDelete(null);
      
      // Show success toast
      const toast = document.createElement('div');
      toast.className = 'fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      toast.textContent = 'API token revoked successfully';
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
    } catch (err) {
      console.error('Error deleting API token:', err);
      setError('Failed to revoke API token');
    } finally {
      setDeleting(null);
    }
  };

  const copyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    
    // Show success toast
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50';
    toast.textContent = 'API token copied to clipboard';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-lg">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}
      
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Key className="h-5 w-5 text-blue-600" />
          API Access
        </h2>
        
        <button
          onClick={() => setTokenName('Default')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Key className="h-5 w-5" />
          Generate API Token
        </button>
      </div>
      
      <div className="bg-blue-50 p-4 rounded-lg flex items-start gap-3">
        <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-blue-800 font-medium">API Access Information</p>
          <p className="text-sm text-blue-700 mt-1">
            Generate an API token to access your supplier data programmatically. Use this token in your external systems to fetch bookings, invoices, and payment data.
          </p>
          <p className="text-sm text-blue-700 mt-2">
            <strong>Base URL:</strong> {import.meta.env.VITE_SUPABASE_URL}/functions/v1/
          </p>
          <p className="text-sm text-blue-700">
            <strong>Available Endpoints:</strong>
          </p>
          <ul className="text-sm text-blue-700 list-disc list-inside ml-2">
            <li>GET /supplier/bookings - Fetch your bookings</li>
            <li>GET /supplier/invoices - Fetch your invoices</li>
            <li>GET /supplier/payouts - Fetch your payouts</li>
          </ul>
          <p className="text-sm text-blue-700 mt-2">
            <strong>Authentication:</strong> Add your token to the request headers as <code className="bg-blue-100 px-1 py-0.5 rounded">Authorization: Bearer YOUR_TOKEN</code>
          </p>
        </div>
      </div>
      
      {tokenName && (
        <div className="bg-white rounded-lg shadow-sm p-4 border">
          <h3 className="font-medium mb-4">Generate New API Token</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Token Name
              </label>
              <input
                type="text"
                value={tokenName}
                onChange={(e) => setTokenName(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Booking System Integration"
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setTokenName('')}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={generateToken}
                disabled={generating || !tokenName.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {generating ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Key className="h-5 w-5" />
                )}
                Generate Token
              </button>
            </div>
          </div>
        </div>
      )}
      
      {tokens.length > 0 ? (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Used
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expires
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tokens.map((token) => (
                  <tr key={token.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Key className="h-5 w-5 text-gray-400 mr-2" />
                        <span className="font-medium">{token.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(token.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {token.last_used_at ? formatDate(token.last_used_at) : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {token.expires_at ? formatDate(token.expires_at) : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => {
                          setTokenToDelete(token.id);
                          setShowConfirmDelete(true);
                        }}
                        disabled={deleting === token.id}
                        className="text-red-600 hover:text-red-900"
                      >
                        {deleting === token.id ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <Trash2 className="h-5 w-5" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Key className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No API Tokens</h3>
          <p className="text-gray-500 mb-4">
            You haven't created any API tokens yet.
          </p>
          <button
            onClick={() => setTokenName('Default')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Generate Your First Token
          </button>
        </div>
      )}
      
      {/* Confirm Delete Modal */}
      <Dialog
        open={showConfirmDelete}
        onClose={() => setShowConfirmDelete(false)}
        className="fixed inset-0 z-10 overflow-y-auto"
      >
        <div className="flex items-center justify-center min-h-screen">
          <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />
          
          <div className="relative bg-white rounded-lg max-w-md w-full mx-4 p-6">
            <Dialog.Title className="text-lg font-medium mb-4">
              Revoke API Token
            </Dialog.Title>
            
            <p className="text-gray-600 mb-6">
              Are you sure you want to revoke this API token? This action cannot be undone, and any systems using this token will lose access immediately.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmDelete(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => tokenToDelete && deleteToken(tokenToDelete)}
                disabled={deleting !== null}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {deleting !== null ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Trash2 className="h-5 w-5" />
                )}
                Revoke Token
              </button>
            </div>
          </div>
        </div>
      </Dialog>
      
      {/* New Token Modal */}
      <Dialog
        open={showNewToken}
        onClose={() => setShowNewToken(false)}
        className="fixed inset-0 z-10 overflow-y-auto"
      >
        <div className="flex items-center justify-center min-h-screen">
          <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />
          
          <div className="relative bg-white rounded-lg max-w-md w-full mx-4 p-6">
            <div className="flex items-center gap-2 mb-4 text-green-600">
              <CheckCircle2 className="h-6 w-6" />
              <Dialog.Title className="text-lg font-medium">
                API Token Generated
              </Dialog.Title>
            </div>
            
            <p className="text-gray-600 mb-4">
              Your new API token has been generated. This is the only time you'll see this token, so make sure to copy it now.
            </p>
            
            <div className="bg-gray-50 p-3 rounded-lg mb-6 break-all font-mono text-sm">
              {newToken}
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => copyToken(newToken)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Copy className="h-5 w-5" />
                Copy Token
              </button>
              <button
                onClick={() => setShowNewToken(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
}