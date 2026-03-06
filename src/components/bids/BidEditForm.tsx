'use client';

import { useState } from 'react';
import { updateBid } from '@/app/actions/bids';

export default function BidEditForm({
  bidId,
  currentPrice,
  onSuccess,
}: {
  bidId: string;
  currentPrice: number;
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
      await updateBid(bidId, price);
      onSuccess();
    } catch {
      setError('Failed to update bid. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1">
          New Bid Amount ($)
        </label>
        <input
          name="price"
          type="number"
          step="0.01"
          required
          autoFocus
          defaultValue={currentPrice}
          className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
          placeholder="0.00"
        />
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      </div>

      <div className="bg-amber-50 p-3 rounded-lg text-xs text-amber-700">
        Note: You can only edit bids that are still <strong>Pending</strong>.
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-black text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition disabled:opacity-50"
      >
        {loading ? 'Updating...' : 'Update Bid'}
      </button>
    </form>
  );
}
