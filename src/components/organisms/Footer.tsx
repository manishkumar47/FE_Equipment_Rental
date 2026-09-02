import { URL } from '../../routes/url-constant';
import React from 'react';
import { Boxes } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white">
      {/* Main footer content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-[#1E3A5F] flex items-center justify-center text-white">
              <Boxes className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold text-slate-800">EquipFlow Systems</span>
            <span>&copy; {new Date().getFullYear()} Enterprise Rental Platform.</span>
          </div>

          <div className="flex items-center gap-6">
            <Link to={URL.EQUIPMENT} className="hover:text-slate-900 transition-colors">
              Equipment Catalog
            </Link>
            <Link to={URL.RENTALS} className="hover:text-slate-900 transition-colors">
              Rental History
            </Link>
            <Link to={URL.PROFILE} className="hover:text-slate-900 transition-colors">
              User Profile
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
