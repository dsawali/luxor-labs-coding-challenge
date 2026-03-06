'use client';

import { useState } from 'react';
import { createBid } from '@/app/actions/bids';

export default function BidForm({
  collectionId,
  userId,
  userName,
  onSuccess,
}: {
  collectionId: string;
  userId: string;
  userName?: string;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const price = parseFloat(formData.get('price') as string);

    if (isNaN(price) || price <= 0) {
      setError('Please enter a valid bid amount.');
      setLoading(false);
      return;
    }

    try {
      await createBid({
        collectionId,
        userId,
        price,
        userName,
      });
      onSuccess();
    } catch (err) {
      setError('Failed to place bid. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1">
          Your Bid Amount ($)
        </label>
        <input
          name="price"
          type="number"
          step="0.01"
          required
          autoFocus
          className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
          placeholder="0.00"
        />
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      </div>

      <div className="bg-blue-50 p-3 rounded-lg text-xs text-blue-700">
        Note: Once submitted, your bid will be marked as{' '}
        <strong>Pending</strong> until the owner accepts or rejects it.
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-black text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition disabled:opacity-50"
      >
        {loading ? 'Submitting...' : 'Confirm Bid'}
      </button>
    </form>
  );
}
