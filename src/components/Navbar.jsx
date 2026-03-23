import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="bg-zinc-900 text-white px-6 py-4 flex justify-between">
      <Link to="/" className="font-bold">Eaglercraft2</Link>
      <div className="flex gap-6">
        <Link to="/forums" className="hover:text-blue-400">Forums</Link>
      </div>
    </nav>
  );
}