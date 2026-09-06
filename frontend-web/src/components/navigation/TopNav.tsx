'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Bell, LogIn, LogOut, Menu, Settings, X } from 'lucide-react';
import { useLoginButton } from '@/lib/login-button-context';

const navItems = [
  { href: '/dashboard', label: '儀表板' },
  { href: '/map', label: '空氣地圖' },
  { href: '/explorer', label: '資料探索' },
  { href: '/events', label: '事件紀錄' },
  { href: '/alerts', label: '警示通知' },
];

export function TopNav() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isLoginButtonActive, toggleLoginButton } = useLoginButton();

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
      aria-label={isLoginButtonActive ? '登出' : '登入'}
      title={isLoginButtonActive ? '登出' : '登入'}
    >
      {isLoginButtonActive ? <LogOut size={17} /> : <LogIn size={17} />}
    </button>
  );

  return (
    <>
      <nav className={`top-nav${scrolled ? ' scrolled' : ''}`}>
        <div className="top-nav-inner">
          <Link href="/dashboard" className="top-nav-logo">
            <span className="top-nav-logo-img">
              <Image
                src="https://res.cloudinary.com/da3bvump4/image/upload/v1787303369/5f7a91ad-47c8-40e5-9981-cd41395dcb99_vrclgp.png"
                alt="Taoyuan Air Logo"
                width={34}
                height={34}
                style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                unoptimized
              />
            </span>
            <span className="top-nav-logo-text">Taoyuan Air</span>
          </Link>

          <div className="top-nav-links">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`top-nav-link${isActive(item.href) ? ' active' : ''}`}
              >
                <span className="top-nav-link-inner">{item.label}</span>
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

        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`mobile-nav-link${isActive(item.href) ? ' active' : ''}`}
            onClick={() => setMobileOpen(false)}
          >
            {item.label}
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
