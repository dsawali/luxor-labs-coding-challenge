'use client';

import { useState } from 'react';
import { createCollection, updateCollection } from '@/app/actions/collections';

export default function CollectionForm({
  initialData,
  userId,
  userName,
  onSuccess,
}: {
  initialData?: any;
  userId: string;
  userName?: string;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const payload = {
      name: formData.get('name') as string,
      descriptions: formData.get('descriptions') as string,
      price: parseFloat(formData.get('price') as string),
      stocks: parseInt(formData.get('stocks') as string),
      userId: userId,
      userName: userName,
    };

    if (initialData?.id) {
      await updateCollection(initialData.id, payload);
    } else {
      await createCollection(payload);
    }

    setLoading(false);
    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1">
          Collection Name
        </label>
        <input
          name="name"
          defaultValue={initialData?.name}
          required
          className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
          placeholder="e.g. Vintage Watch"
        />
      </div>
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1">
          Description
        </label>
        <textarea
          name="descriptions"
          defaultValue={initialData?.descriptions}
          required
          className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
          rows={3}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">
            Base Price ($)
          </label>
          <input
            name="price"
            type="number"
            step="0.01"
            defaultValue={initialData?.price}
            required
            className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">
            Stock Qty
          </label>
          <input
            name="stocks"
            type="number"
            defaultValue={initialData?.stocks}
            required
            className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition disabled:opacity-50"
      >
        {loading
          ? 'Saving...'
          : initialData
            ? 'Update Collection'
            : 'Create Collection'}
      </button>
    </form>
  );
}
