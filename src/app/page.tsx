'use client';

import { useState, useEffect } from 'react';
import { getCollections } from './actions/collections';
import CollectionRow from '@/components/collections/CollectionRow';
import Link from 'next/link';
import Modal from '@/components/ui/Modal';
import CollectionForm from '@/components/collections/CollectionForm';

const MOCK_USERS = [
  { id: 'user_alice_1', name: 'Alice (test)' },
  { id: 'user_bob_2', name: 'Bob (test)' },
  { id: 'user_charlie_3', name: 'Charlie (test)' },
];

export default function BiddingPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const [collections, setCollections] = useState<any[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(MOCK_USERS[0].id);

  const currentUserObj = MOCK_USERS.find(u => u.id === currentUserId) || MOCK_USERS[0];
  const cleanName = currentUserObj.name.replace(/\s\([^)]+\)/, ''); // e.g., "Alice (Owner)" -> "Alice"
  
  const currentUser = {
    id: currentUserObj.id,
    name: cleanName
  };

  // Fetch data on mount and when page changes
  useEffect(() => {
    const fetchData = async () => {
      const params = await searchParams;
      const page = Number(params.page) || 1;
      const data = await getCollections(page, 10);
      
      setCollections(data.collections);
      setTotalPages(data.totalPages);
      setCurrentPage(data.currentPage);
    };
    
    fetchData();
  }, [searchParams]);

  return (
    <main className="bg-gray-50 min-h-screen py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-10 pb-6 border-b border-gray-200">
          <h1 className="text-4xl font-extrabold tracking-tighter text-gray-950">BidBidBid</h1>
          <button 
            onClick={() => setIsCreateOpen(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold shadow hover:bg-blue-700"
          >
            + Create New Collection
          </button>
        </div>

        {/* --- Create Collection Modal --- */}
        <Modal 
          isOpen={isCreateOpen} 
          onClose={() => setIsCreateOpen(false)} 
          title="Create New Collection"
        >
          <CollectionForm 
            userId={currentUser.id} 
            userName={currentUser.name}
            onSuccess={() => setIsCreateOpen(false)} 
          />
        </Modal>

        <div className="space-y-4">
          {collections.map((c: any) => (
            <CollectionRow key={c.id} collection={c} currentUser={currentUser} />
          ))}
        </div>

        {/* --- Pagination Controls --- */}
        <div className="flex justify-center items-center gap-4 mt-12 pb-12">
          <Link
            href={`/?page=${currentPage - 1}`}
            className={`px-6 py-2 rounded-xl border font-bold transition shadow-sm ${
              currentPage <= 1 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed pointer-events-none' 
                : 'bg-white text-gray-900 hover:bg-gray-50 border-gray-200'
            }`}
          >
            Previous
          </Link>
          
          <div className="bg-white border border-gray-200 px-4 py-2 rounded-xl shadow-sm">
            <span className="text-sm font-bold text-gray-700">
              Page <span className="text-blue-600">{currentPage}</span> of {totalPages}
            </span>
          </div>

          <Link
            href={`/?page=${currentPage + 1}`}
            className={`px-6 py-2 rounded-xl border font-bold transition shadow-sm ${
              currentPage >= totalPages 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed pointer-events-none' 
                : 'bg-white text-gray-900 hover:bg-gray-50 border-gray-200'
            }`}
          >
            Next
          </Link>
        </div>
      </div>

      {/* The Persona Switcher UI (Fixed at the bottom) */}
      <div className="fixed bottom-6 right-6 z-[100] bg-white border-2 border-blue-500 p-4 rounded-2xl shadow-2xl">
        <p className="text-[10px] font-black text-blue-600 uppercase mb-2 tracking-widest">Dev Testing</p>
        <div className="flex flex-col gap-2">
          {MOCK_USERS.map((user) => (
            <button
              key={user.id}
              onClick={() => setCurrentUserId(user.id)}
              className={`text-xs px-3 py-2 rounded-lg font-bold transition-all ${
                currentUserId === user.id 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {user.name}
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}