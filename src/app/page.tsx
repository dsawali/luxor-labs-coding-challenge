import { getCollections } from './actions/collections';
import BiddingPageClient from './PageClient';

export default async function BiddingPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params?.page) || 1;
  const data = await getCollections(page, 10);

  return (
    <BiddingPageClient
      collections={data.collections as any}
      totalPages={data.totalPages}
      currentPage={page}
    />
  );
}
