import type { ReactNode } from 'react';
import { Icon } from '../components/ui/Icon';

/** Split-screen layout for the sign-in and sign-up pages. */
export function AuthLayout({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="auth">
      <section className="auth__hero">
        {/* Platform name at the top, horizontally centered */}
        <div className="brand brand--light auth__hero-brand">
          <span className="brand__logo">
            <Icon name="pulse" size={22} />
          </span>
          <span className="brand__name">Cashflow</span>
        </div>

        {/* Tagline centered vertically between platform name and image, and horizontally centered */}
        <div className="auth__hero-tagline-wrap">
          <h2 className="auth__hero-tagline">Master your money with clarity and control.</h2>
        </div>

        {/* Image at bottom, horizontally centered */}
        <div className="auth__hero-image-wrap">
          <div className="auth__hero-image-card">
            <img
              src="/auth-illustration.jpg"
              alt="Cashflow Budget Management Illustration"
            />
          </div>
        </div>
      </section>

      <section className="auth__panel">
        <div className="auth__card">
          <div className="brand auth__mobile-brand">
            <span className="brand__logo">
              <Icon name="pulse" size={18} />
            </span>
            <span className="brand__name">Cashflow</span>
          </div>
          <h1>{title}</h1>
          <p className="auth__subtitle">{subtitle}</p>
          {children}
        </div>
      </section>
    </div>
  );
}
