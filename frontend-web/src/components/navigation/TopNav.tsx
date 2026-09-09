'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Bell, Landmark, Menu, Settings, UserRound, X } from 'lucide-react';
import { useLoginButton } from '@/lib/login-button-context';

type NavItem = { href: string; label: string; public: boolean; govLabel?: string };

const navItems: NavItem[] = [
  { href: '/dashboard', label: '空氣總覽', public: true },
  { href: '/map', label: '監測地圖', public: true },
  { href: '/explorer', label: '資料整合', public: true },
  { href: '/events', label: '垂直觀測', public: false },
  { href: '/alerts', label: '健康守護', govLabel: '治理支援', public: true },
];

export function TopNav() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { role, toggleLoginButton } = useLoginButton();
  const visibleNavItems = navItems.filter((item) => role === 'government' || item.public);
  const navLabel = (item: NavItem) =>
    role === 'government' && item.govLabel ? item.govLabel : item.label;

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        setScrolled(window.scrollY > 24);
        ticking = false;
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isActive = (href: string) =>
    pathname === href || (href === '/dashboard' && pathname === '/');

  const renderAuthButton = () => (
    <button
      type="button"
      onClick={toggleLoginButton}
      className="top-nav-action-btn"
      aria-label={role === 'government' ? '政府模式' : '民眾模式'}
      title={role === 'government' ? '政府模式：按下切到民眾模式' : '民眾模式：按下切到政府模式'}
    >
      {role === 'government' ? <Landmark size={17} /> : <UserRound size={17} />}
    </button>
  );

  return (
    <>
      <nav className={`top-nav${scrolled ? ' scrolled' : ''}`}>
        <div className="top-nav-inner">
          <Link href="/dashboard" className="top-nav-brand" aria-label="Taoyuan Air">
            <span className="top-nav-brand-logo">
              <Image
                src="/logo.png"
                alt="Taoyuan Air Logo"
                width={46}
                height={46}
                style={{ objectFit: 'cover', width: '100%', height: '100%' }}
              />
            </span>
            <span className="top-nav-brand-text">
              <span className="top-nav-brand-primary">Taoyuan Air</span>
              <span className="top-nav-brand-secondary">
                Monitor &amp; Decision
                <span className="top-nav-brand-bang" aria-hidden="true">!</span>
              </span>
            </span>
          </Link>

          <div className="top-nav-right">
            <div className="top-nav-links">
              {visibleNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`top-nav-link${isActive(item.href) ? ' active' : ''}`}
                >
                  <span className="top-nav-link-inner">{navLabel(item)}</span>
                </Link>
              ))}
            </div>

            <div className="top-nav-actions">
              <Link href="/notifications" className="top-nav-action-btn" title="通知" aria-label="通知">
                <Bell size={17} />
              </Link>
              <Link href="/settings" className="top-nav-action-btn" title="設定" aria-label="設定">
                <Settings size={17} />
              </Link>
              {renderAuthButton()}
              <button
                className="top-nav-hamburger"
                aria-label={mobileOpen ? '關閉選單' : '開啟選單'}
                onClick={() => setMobileOpen(!mobileOpen)}
              >
                <Menu size={22} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div
        className={`mobile-overlay${mobileOpen ? ' visible' : ''}`}
        onClick={() => setMobileOpen(false)}
      />

      <div className={`mobile-nav-panel${mobileOpen ? ' open' : ''}`}>
        <button
          className="mobile-nav-close"
          aria-label="關閉選單"
          onClick={() => setMobileOpen(false)}
        >
          <X size={28} />
        </button>

        {visibleNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`mobile-nav-link${isActive(item.href) ? ' active' : ''}`}
            onClick={() => setMobileOpen(false)}
          >
            {navLabel(item)}
          </Link>
        ))}

        <div className="mobile-nav-actions">
          <Link href="/notifications" className="top-nav-action-btn" title="通知" onClick={() => setMobileOpen(false)}>
            <Bell size={17} />
          </Link>
          <Link href="/settings" className="top-nav-action-btn" title="設定" onClick={() => setMobileOpen(false)}>
            <Settings size={17} />
          </Link>
          {renderAuthButton()}
        </div>
      </div>
    </>
  );
}
