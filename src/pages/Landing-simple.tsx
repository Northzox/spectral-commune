import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function Landing() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center max-w-md">
        <h1 className="text-4xl font-bold text-white mb-8">
          Haunted<span className="text-red-500">Cord</span>
        </h1>
        <p className="text-gray-400 mb-8">
          Where shadows communicate freely.
        </p>
        <div className="space-y-4">
          <Link to="/login">
            <Button size="lg" className="w-full bg-red-600 hover:bg-red-700 text-white">
              Log In
            </Button>
          </Link>
          <Link to="/register">
            <Button size="lg" variant="outline" className="w-full border-gray-600 text-white hover:bg-gray-700">
              Sign Up
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
