export interface User {
  id: string;
  name: string;
}

export interface Bid {
  id: string;
  userId: string;
  price: number;
  status: string;
  user: User;
}

export interface Collection {
  id: string;
  name: string;
  descriptions: string;
  stocks: number;
  price: number;
  userId: string;
  bids: Bid[];
}