import Feed from '@/components/feed/Feed';
import ProfileLinks from '@/components/ProfileLinks';

export const metadata = {
  title: 'Instagram Clone',
  description: 'Home Feed - Instagram Clone',
};

export default function Home() {
  return (
    <div className="md:grid md:grid-cols-4 gap-4 py-4 px-4">
      <div className="col-span-3">
        <Feed />
      </div>
      <div className="hidden md:block">
        <div className="sticky top-4">
          <ProfileLinks />
        </div>
      </div>
    </div>
  );
}
