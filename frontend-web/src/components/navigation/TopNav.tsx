'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { Bell, Landmark, LogIn, Menu, Settings, UserRound, X } from 'lucide-react';
import { type DemoRole, type LoginRole, useLoginButton } from '@/lib/login-button-context';

type NavItem = { href: string; label: string; visibility: DemoRole[]; govLabel?: string };

const navItems: NavItem[] = [
  { href: '/dashboard', label: '空氣總覽', visibility: ['public', 'citizen', 'government'] },
  { href: '/map', label: '監測地圖', visibility: ['public', 'citizen', 'government'] },
  { href: '/explorer', label: '資料整合', visibility: ['public', 'citizen', 'government'] },
  { href: '/events', label: '垂直觀測', visibility: ['government'] },
  { href: '/alerts', label: '健康守護', govLabel: '治理支援', visibility: ['citizen', 'government'] },
];

// Pre-filled demo credentials shown in the login modal, kept per-role so the
// account field stays consistent with the selected identity.
const DEFAULT_ACCOUNTS: Record<LoginRole, string> = {
  citizen: 'taoyuan.citizen@example.com',
  government: 'epb.taoyuan@example.gov.tw',
};

export function TopNav() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [loginRole, setLoginRole] = useState<LoginRole>('citizen');
  const [account, setAccount] = useState(DEFAULT_ACCOUNTS.citizen);
  const [password, setPassword] = useState('airguard2026');
  const [accountEdited, setAccountEdited] = useState(false);
  const [registerHint, setRegisterHint] = useState(false);
  const { role, isAuthenticated, login, logout } = useLoginButton();
  const visibleNavItems = navItems.filter((item) => item.visibility.includes(role));
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

  // Close the login modal on Escape and lock body scroll while it is open,
  // matching the map sheet / ControlKit overlay behaviour.
  useEffect(() => {
    if (!loginOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setLoginOpen(false);
    };
    window.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [loginOpen]);

  const isActive = (href: string) =>
    pathname === href || (href === '/dashboard' && pathname === '/');

  const chooseLoginRole = (nextRole: LoginRole) => {
    setLoginRole(nextRole);
    if (!accountEdited) setAccount(DEFAULT_ACCOUNTS[nextRole]);
  };

  const openLogin = () => {
    const nextRole: LoginRole = role === 'government' ? 'government' : 'citizen';
    setLoginRole(nextRole);
    if (!accountEdited) setAccount(DEFAULT_ACCOUNTS[nextRole]);
    setRegisterHint(false);
    setLoginOpen(true);
    setMobileOpen(false);
  };

  const submitLogin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!account.trim() || !password.trim()) return;
    login(loginRole);
    setRegisterHint(false);
    setLoginOpen(false);
  };

  const renderAuthButton = () => (
    isAuthenticated ? (
      <button
        type="button"
        onClick={openLogin}
        className="top-nav-login-chip"
        aria-label={role === 'government' ? '政府模式，開啟登入設定' : '民眾模式，開啟登入設定'}
        title="開啟登入設定"
      >
        {role === 'government' ? <Landmark size={16} /> : <UserRound size={16} />}
        <span>{role === 'government' ? '政府' : '民眾'}</span>
      </button>
    ) : (
      <button
        type="button"
        onClick={openLogin}
        className="top-nav-login-btn"
        aria-label="登入"
        title="登入"
      >
        <LogIn size={16} />
        <span>登入</span>
      </button>
    )
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
              {isAuthenticated && (
                <>
                  <Link href="/notifications" className="top-nav-action-btn" title="通知" aria-label="通知">
                    <Bell size={17} />
                  </Link>
                  <Link href="/settings" className="top-nav-action-btn" title="設定" aria-label="設定">
                    <Settings size={17} />
                  </Link>
                </>
              )}
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
          {isAuthenticated && (
            <>
              <Link href="/notifications" className="top-nav-action-btn" title="通知" onClick={() => setMobileOpen(false)}>
                <Bell size={17} />
              </Link>
              <Link href="/settings" className="top-nav-action-btn" title="設定" onClick={() => setMobileOpen(false)}>
                <Settings size={17} />
              </Link>
            </>
          )}
          {renderAuthButton()}
        </div>
      </div>

      {loginOpen && (
        <div className="login-modal-backdrop" role="presentation" onMouseDown={() => setLoginOpen(false)}>
          <div
            className="login-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="login-modal-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              className="login-modal-close"
              type="button"
              aria-label="關閉登入視窗"
              title="關閉"
              onClick={() => setLoginOpen(false)}
            >
              <X size={19} />
            </button>

            <div className="login-modal-heading">
              <span className="login-modal-icon">
                <LogIn size={20} />
              </span>
              <div>
                <h2 id="login-modal-title">登入 Taoyuan Air</h2>
                <p>選擇身分後，開啟對應服務頁面。</p>
              </div>
            </div>

            <form className="login-form" onSubmit={submitLogin}>
              <label className="login-field">
                <span>帳號</span>
                <input
                  value={account}
                  autoComplete="username"
                  onChange={(event) => {
                    setAccount(event.target.value);
                    setAccountEdited(true);
                  }}
                />
              </label>

              <label className="login-field">
                <span>密碼</span>
                <input
                  type="password"
                  value={password}
                  autoComplete="current-password"
                  onChange={(event) => setPassword(event.target.value)}
                />
              </label>

              <div className="login-role-group" aria-label="角色選擇">
                <button
                  type="button"
                  className={`login-role-option${loginRole === 'citizen' ? ' active' : ''}`}
                  aria-pressed={loginRole === 'citizen'}
                  onClick={() => chooseLoginRole('citizen')}
                >
                  <UserRound size={16} />
                  <span>民眾</span>
                </button>
                <button
                  type="button"
                  className={`login-role-option${loginRole === 'government' ? ' active' : ''}`}
                  aria-pressed={loginRole === 'government'}
                  onClick={() => chooseLoginRole('government')}
                >
                  <Landmark size={16} />
                  <span>政府</span>
                </button>
              </div>

              <button className="login-submit" type="submit">
                <LogIn size={16} />
                <span>登入</span>
              </button>

              <div className="login-register-row">
                <span>還未開通帳號？</span>
                <button type="button" onClick={() => setRegisterHint(true)}>立即註冊</button>
              </div>

              {registerHint && (
                <p className="login-register-hint" role="status">
                  註冊審核尚未開放，請洽桃園市環保局取得開通帳號。
                </p>
              )}

              {isAuthenticated && (
                <button
                  className="login-logout"
                  type="button"
                  onClick={() => {
                    logout();
                    setRegisterHint(false);
                    setLoginOpen(false);
                  }}
                >
                  登出目前帳號
                </button>
              )}
            </form>
          </div>
        </div>
      )}
    </>
  );
}
