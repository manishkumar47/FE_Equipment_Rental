import { URL } from '../routes/url-constant';
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/atoms/Button';
import { Boxes, ArrowLeft } from 'lucide-react';

export const NotFound: React.FC = () => {
  return (
    <div className="py-20 text-center max-w-md mx-auto space-y-5">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 text-[#1E3A5F] flex items-center justify-center mx-auto shadow-2xs">
        <Boxes className="w-8 h-8" />
      </div>
      <div>
        <h1 className="text-3xl font-bold text-slate-900">404</h1>
        <h2 className="text-base font-semibold text-slate-700 mt-1">Page Not Found</h2>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
          The page or equipment resource you are attempting to access does not exist or has been relocated.
        </p>
      </div>
      <div className="pt-2">
        <Link to={URL.EQUIPMENT}>
          <Button variant="primary" size="md" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Equipment Catalog
          </Button>
        </Link>
      </div>
    </div>
  );
};
