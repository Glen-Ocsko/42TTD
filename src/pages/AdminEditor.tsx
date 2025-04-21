import React from 'react';
import AdminActivityEditor from '../components/AdminActivityEditor';

export default function AdminEditor() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <h1 className="text-3xl font-bold text-center mb-8">Activity Editor</h1>
      <AdminActivityEditor />
    </div>
  );
}