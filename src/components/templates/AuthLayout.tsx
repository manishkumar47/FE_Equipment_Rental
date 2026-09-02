import { URL } from '../../routes/url-constant';
import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Boxes, ShieldCheck, CheckCircle2, Server, Cpu, Clock } from 'lucide-react';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#F8FAFC]">
      {/* Left branding panel */}
      <div className="lg:w-1/2 bg-[#1E3A5F] text-white p-6 sm:p-8 lg:p-16 flex flex-col justify-between relative overflow-hidden">
        {/* Subtle grid pattern background */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: '24px 24px',
          }}
        />

        <div className="relative z-10">
          <Link to={URL.HOME} className="flex items-center gap-3 w-fit group">
            <div className="w-10 h-10 rounded-md bg-white/10 border border-white/20 flex items-center justify-center text-white backdrop-blur-xs group-hover:bg-white/20 transition-colors">
              <Boxes className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                EquipFlow
                
              </span>
            </div>
          </Link>
        </div>

        {/* Center narrative */}
        <div className="relative z-10 my-12 lg:my-0 max-w-md">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-white/10 text-xs font-semibold text-white/90 border border-white/15 mb-6">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Enterprise Equipment Operations
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white leading-tight mb-4">
            Reliable Equipment Rental for Production Teams
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed mb-8">
            Access enterprise-grade workstations, cameras, audio gear, networking hardware, and studio equipment with seamless reservations and immediate availability verification.
          </p>

          {/* Quick feature list */}
          <div className="space-y-3.5 border-t border-white/15 pt-6">
            <div className="flex items-center gap-3 text-xs text-slate-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Real-time stock reservation and conflict-free booking</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-200">
              <Clock className="w-4 h-4 text-sky-300 shrink-0" />
              <span>Instant return scheduling & automated date tracking</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-200">
              <Cpu className="w-4 h-4 text-amber-300 shrink-0" />
              <span>Over 90+ verified hardware categories and accessories</span>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="relative z-10 flex items-center justify-between text-xs text-slate-400 border-t border-white/10 pt-6">
          <span>&copy; {new Date().getFullYear()} EquipFlow Systems Inc.</span>
          <span className="flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5" /> High-Availability Infrastructure
          </span>
        </div>
      </div>

      {/* Right form panel */}
      <div className="lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-16">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </div>
    </div>
  );
};
