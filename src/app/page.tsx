import Feed from '@/components/feed/Feed';

export const metadata = {
  title: 'Instagram Clone',
  description: 'Home Feed - Instagram Clone',
};

export default function Home() {
  return (
    <div className="py-4">
      <Feed />
    </div>
  );
}
