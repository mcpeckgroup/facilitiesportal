'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

export default function NewRequestPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('routine');
  const [business, setBusiness] = useState('Infuserve America');
  const [files, setFiles] = useState<FileList | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let uploadedUrls: string[] = [];

    if (files) {
      for (const file of Array.from(files)) {
        const { data, error } = await supabase.storage
          .from('attachments')
          .upload(`${Date.now()}-${file.name}`, file);

        if (!error && data?.path) {
          const { data: urlData } = supabase.storage
            .from('attachments')
            .getPublicUrl(data.path);

          if (urlData?.publicUrl) {
            uploadedUrls.push(urlData.publicUrl);
          }
        }
      }
    }

    const { error } = await supabase.from('work_orders').insert({
      title,
      description,
      priority,
      business,
      status: 'open',
      attachments: uploadedUrls,
    });

    if (!error) {
      router.push('/requests');
    } else {
      alert('Error submitting request: ' + error.message);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">New Work Order</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block">Title</label>
          <input
            className="border rounded w-full px-2 py-1"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block">Description</label>
          <textarea
            className="border rounded w-full px-2 py-1"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block">Business</label>
          <select
            className="border rounded px-2 py-1 w-full"
            value={business}
            onChange={(e) => setBusiness(e.target.value)}
          >
            <option>Infuserve America</option>
            <option>Pharmetric</option>
            <option>Issak</option>
          </select>
        </div>

        <div>
          <label className="block">Priority</label>
          <select
            className="border rounded px-2 py-1 w-full"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option value="emergency">Emergency</option>
            <option value="urgent">Urgent</option>
            <option value="non_critical">Non-Critical</option>
            <option value="routine">Routine</option>
          </select>
        </div>

        <div>
          <label className="block">Attachments</label>
          <input
            type="file"
            multiple
            onChange={(e) => setFiles(e.target.files)}
          />
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Submit
        </button>
      </form>
    </div>
  );
}
