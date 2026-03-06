'use client';

import { useState } from 'react';
import { Gavel, Trash2, Edit, CheckCircle, Clock, X } from 'lucide-react';
import { acceptBid, getBids, deleteBid } from '@/app/actions/bids';
import { deleteCollection } from '@/app/actions/collections';
import Modal from '@/components/ui/Modal';
import CollectionForm from '@/components/collections/CollectionForm';
import BidForm from '@/components/bids/BidForm';
import BidEditForm from '@/components/bids/BidEditForm';
import { Collection, Bid } from '@/types';

export default function CollectionRow({ collection, currentUser }: { collection: Collection, currentUser: { id: string; name: string } }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Modal States
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isBidOpen, setIsBidOpen] = useState(false);
  const [editingBid, setEditingBid] = useState<Bid | null>(null);

  const isOwner = collection.userId === currentUser.id;

  const fetchBidsAndUpdate = async () => {
    setLoading(true);
    const data = await getBids(collection.id);
    setBids(data as Bid[]);
    setLoading(false);
  };

  const toggleExpand = async () => {
    if (!isExpanded && bids.length === 0) {
      await fetchBidsAndUpdate();
    }
    setIsExpanded(!isExpanded);
  };

  const handleAccept = async (bidId: string) => {
    if (confirm("Accepting this bid will reject all others. Proceed?")) {
      await acceptBid(bidId, collection.id);
      const updatedBids = await getBids(collection.id);
      setBids(updatedBids as Bid[]);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevents the row from expanding
    if (confirm("Are you sure you want to delete this collection?")) {
      await deleteCollection(collection.id);
    }
  };

  const handleCancelBid = async (bidId: string) => {
    if (confirm("Are you sure you want to cancel this bid?")) {
      await deleteBid(bidId);
      await fetchBidsAndUpdate();
    }
  };

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm mb-4 overflow-hidden">
      {/* --- Main Collection Card --- */}
      <div 
        className="flex items-center justify-between p-6 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={toggleExpand}
      >
        <div>
          <h3 className="font-extrabold text-2xl tracking-tight text-gray-950">{collection.name}</h3>
          <p className="text-gray-600 mt-1 line-clamp-1">{collection.descriptions}</p>
        </div>
        
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Base Price</p>
              <p className="font-mono text-xl text-green-700 font-medium">${collection.price}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Stock</p>
              <p className="font-semibold text-xl">{collection.stocks}</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            {isOwner ? (
              <>
                <button 
                  onClick={(e) => { e.stopPropagation(); setIsEditOpen(true); }}
                  className="flex items-center gap-1.5 bg-gray-100 text-gray-700 px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-200"
                >
                  <Edit size={16}/> Edit
                </button>
                <button 
                  onClick={handleDelete}
                  className="flex items-center gap-1.5 bg-red-100 text-red-700 px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-red-200"
                >
                  <Trash2 size={16}/> Delete
                </button>
              </>
            ) : (
              <button 
                onClick={(e) => { e.stopPropagation(); setIsBidOpen(true); }}
                className="flex items-center gap-1.5 bg-gray-950 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-800 shadow"
              >
                <Gavel size={16}/> Place Bid
              </button>
            )}
          </div>
        </div>
      </div>

      {/* --- Modals --- */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Collection">
        <CollectionForm 
          initialData={collection} 
          userId={currentUser.id} 
          userName={currentUser.name}
          onSuccess={() => setIsEditOpen(false)} 
        />
      </Modal>

      <Modal 
        isOpen={isBidOpen} 
        onClose={() => setIsBidOpen(false)} 
        title="Place a Bid"
      >
        <BidForm 
          collectionId={collection.id} 
          userId={currentUser.id} 
          userName={currentUser.name}
          onSuccess={async () => {
            setIsBidOpen(false);
            await fetchBidsAndUpdate();
            setIsExpanded(true); 
          }} 
        />
      </Modal>

      <Modal
        isOpen={!!editingBid}
        onClose={() => setEditingBid(null)}
        title="Edit Your Bid"
      >
        {editingBid && (
          <BidEditForm
            bidId={editingBid.id}
            currentPrice={editingBid.price}
            onSuccess={async () => {
              setEditingBid(null);
              await fetchBidsAndUpdate();
            }}
          />
        )}
      </Modal>

      {/* --- Indented Bids Section --- */}
      {isExpanded && (
        <div className="bg-gray-50 p-6 pt-0 border-t border-gray-100 pl-14 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2 mb-4 mt-4">
            <Clock size={16} className="text-gray-400"/>
            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Active Bids</h4>
          </div>

          {loading ? (
            <p className="text-sm text-gray-500 italic py-4">Loading bids...</p>
          ) : (
            <div className="space-y-3">
              {bids.length === 0 ? (
                <p className="text-sm text-gray-400 py-4 border border-dashed border-gray-200 rounded-lg text-center bg-white">No bids yet.</p>
              ) : ( 
                bids.map((bid) => (
                  <div key={bid.id} className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-100 shadow-inner">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-gray-800">{bid.user.name}</span>
                      <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full ${
                        bid.status === 'accepted' ? 'bg-green-100 text-green-800' : 
                        bid.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {bid.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-xl text-gray-950">${bid.price}</span>
                      {/* Collection owner: Accept button */}
                      {isOwner && bid.status === 'pending' && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleAccept(bid.id); }}
                          className="flex items-center gap-1.5 bg-green-600 text-white px-3 py-1.5 rounded-lg font-semibold text-sm hover:bg-green-700 shadow"
                        >
                          <CheckCircle size={16}/> Accept
                        </button>
                      )}
                      {/* Bid owner: Edit & Cancel buttons (only on pending bids) */}
                      {bid.userId === currentUser.id && bid.status === 'pending' && (
                        <>
                          <button
                            onClick={(e) => { e.stopPropagation(); setEditingBid(bid); }}
                            className="flex items-center gap-1.5 bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg font-semibold text-sm hover:bg-blue-200"
                          >
                            <Edit size={14}/> Edit
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleCancelBid(bid.id); }}
                            className="flex items-center gap-1.5 bg-red-100 text-red-700 px-3 py-1.5 rounded-lg font-semibold text-sm hover:bg-red-200"
                          >
                            <X size={14}/> Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
