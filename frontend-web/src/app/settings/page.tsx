'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { authApi } from '@/lib/api-client';
import { Check, ChevronRight, LogOut, Settings, Trash2 } from 'lucide-react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { C, INIT, NAV, card, type Section } from './_components/SettingsParts';
import { SettingsSections } from './_components/SettingsSections';

/* ─── Design tokens ──────────────────────────────────────────── */
export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<Section>('基本資料');
  const [saved, setSaved] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { user, refreshUser, logout } = useAuth();

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  /* 帳戶安全 state */
  const [twoFactor, setTwoFactor] = useState(INIT.twoFactor);

  /* 健康檔案 state */
  const [conditions, setConditions] = useState(INIT.conditions);
  const [profileDistrict, setProfileDistrict] = useState('');
  const [profileGender, setProfileGender] = useState('');
  const [profileSensitivity, setProfileSensitivity] = useState('一般民眾');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [editBirthDate, setEditBirthDate] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [now] = useState(Date.now);
  const passwordChangedAgo = useMemo(() => {
    if (!user?.password_changed_at) return '—';
    const diffInDays = Math.floor(
      (now - new Date(user.password_changed_at).getTime()) / 86400000
    );
    return new Intl.RelativeTimeFormat('zh-TW', { numeric: 'auto' }).format(-diffInDays, 'day');
  }, [user, now]);

  const router = useRouter();
  const handleLogout = async () => {
    await logout();
    router.push('/dashboard');
  };

  const handleEditStart = () => {
    setEditUsername(username);
    setEditEmail(email);
    setEditBirthDate(birthDate);
    setEditMode(true);
    setSaveError('');
  };

  const handleEditCancel = () => {
    setEditMode(false);
    setSaveError('');
  };

  const handleEditSave = async () => {
    setSaveError('');
    try {
      const res = await authApi.updateProfile({ username: editUsername, email: editEmail, birth_date: editBirthDate || null })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setSaveError(parseApiError(data));
        return;
      }
      await refreshUser();
      setEditMode(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setSaveError('網路錯誤，請稍後再試');
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    try {
      const res = await authApi.deleteAccount();
      if (res.ok || res.status === 204) {
        await logout();
        router.push('/login');
      } else {
        const data = await res.json().catch(() => ({}));
        setSaveError(parseApiError(data));
        setShowDeleteModal(false);
      }
    } catch {
      setSaveError('網路錯誤，請稍後再試');
      setShowDeleteModal(false);
    } finally {
      setDeleteLoading(false);
    }
  };

  /* 通知偏好 state */
  const [notifs, setNotifs] = useState(INIT.notifs);

  useEffect(() => {
    if (!user) return;
    // Defer state updates to avoid synchronous setState inside effect
    const t = setTimeout(() => {
      setTwoFactor(user.two_factor_enabled);
      setConditions({
        asthma: user.has_respiratory,
        elderly: user.has_elderly,
        child: user.has_child,
      });
      setNotifs({
        pm25: user.notif_pm25,
        aqi: user.notif_aqi,
        health: user.notif_health,
        system: user.notif_system,
      });
      if (user.default_district) setProfileDistrict(user.default_district);
      if (user.birth_date) setBirthDate(String(user.birth_date).slice(0, 10));
      if (user.gender) setProfileGender(user.gender);
      if (user.sensitivity) setProfileSensitivity(user.sensitivity);
      setUsername(user.username);
      setEmail(user.email);
    }, 0);

    return () => clearTimeout(t);
  }, [user]);

  const healthDirty = user && (
    profileGender !== (user.gender ?? '') ||
    profileDistrict !== (user.default_district ?? '') ||
    profileSensitivity !== user.sensitivity ||
    conditions.asthma !== user.has_respiratory ||
    conditions.elderly !== user.has_elderly ||
    conditions.child !== user.has_child
  );

  const profileDirty = user && (
    username !== (user.username ?? '') || email !== (user.email ?? '')
  );

  const securityDirty = user ? (
    twoFactor !== user.two_factor_enabled ||
    !!currentPassword || !!newPassword || !!newPasswordConfirm
  ) : false;

  const notifsDirty = user && (
    notifs.pm25 !== user.notif_pm25 ||
    notifs.aqi !== user.notif_aqi ||
    notifs.health !== user.notif_health ||
    notifs.system !== user.notif_system
  );

  const isDirty =
    securityDirty ||
    !!notifsDirty ||
    !!healthDirty || !!profileDirty;

  function parseApiError(data: { detail?: unknown }): string {
    const d = data.detail;
    if (Array.isArray(d)) return d.map((e: { msg: string }) => e.msg).join('、');
    if (typeof d === 'string') return d;
    return '儲存失敗';
  }

  const handleSave = async () => {
    setSaveError('');
    try {
      // 基本資料
      if (activeSection === '基本資料' && profileDirty) {
        const res = await authApi.updateProfile({ username, email });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setSaveError(parseApiError(data));
          return;
        }
      }

      // 帳戶安全（含 2FA + 密碼）
      if (activeSection === '帳戶安全' && securityDirty) {
        const payload: Record<string, unknown> = { two_factor_enabled: twoFactor };
        if (newPassword) {
          if (newPassword !== newPasswordConfirm) {
            setSaveError('兩次新密碼輸入不一致');
            return;
          }
          payload.current_password = currentPassword;
          payload.new_password = newPassword;
        }
        const res = await authApi.updateSecurity(payload);
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setSaveError(parseApiError(data));
          return;
        }
        setCurrentPassword('');
        setNewPassword('');
        setNewPasswordConfirm('');
      }

      // 健康檔案
      if (healthDirty) {
        const res = await authApi.updateHealth({
          gender: profileGender || null,
          default_district: profileDistrict || null,
          sensitivity: profileSensitivity,
          has_respiratory: conditions.asthma,
          has_elderly: conditions.elderly,
          has_child: conditions.child,
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setSaveError(parseApiError(data));
          return;
        }
      }

      // 通知偏好
      if (notifsDirty) {
        const res = await authApi.updateNotifications({
          notif_pm25: notifs.pm25,
          notif_aqi: notifs.aqi,
          notif_health: notifs.health,
          notif_system: notifs.system,
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setSaveError(parseApiError(data));
          return;
        }
      }

      await refreshUser();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setSaveError('網路錯誤，請稍後再試');
    }
  };

  return (
    <AuthGuard>
    <div style={{ minHeight: '100vh', background: 'var(--app-bg-gradient)', paddingBottom: 100 }}>
      <div style={{ padding: isMobile ? '20px 16px 80px' : '28px 40px 32px' }}>

        {/* ── Page header（只放標題 + 儲存按鈕）──────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              backgroundColor: C.primaryAlpha, border: `1px solid ${C.primaryBorder}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Settings size={18} color={C.primary} strokeWidth={2} />
            </div>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: C.text, margin: 0, lineHeight: 1.2 }}>用戶設定</h1>
              <p style={{ fontSize: 12, color: C.hint, margin: 0, marginTop: 2 }}>管理帳號、健康資訊與通知偏好</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-end' : 'center', gap: 4 }}>
            {isDirty && !saved && (
              <span 
                style={{ 
                  padding: isMobile ? '5px 10px' : '9px 20px', marginBottom: isMobile ? 5 : 0, borderRadius: 99, fontSize: 12, color: C.primary, fontWeight: 600,
                  backgroundColor: saved ? 'rgba(92,138,118,0.12)' : isDirty ? C.primaryAlpha : 'rgba(23,58,94,0.08)',
                  border: `1px solid ${saved ? 'rgba(92,138,118,0.30)' : isDirty ? C.primaryBorder : 'rgba(23,58,94,0.18)'}`,  
                }}
              >
                有尚未儲存的變更
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={!isDirty && !saved}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '9px 20px', borderRadius: 99, cursor: isDirty ? 'pointer' : 'default', marginLeft: isMobile ? 0 : 8,
                backgroundColor: saved ? 'rgba(92,138,118,0.12)' : isDirty ? C.primaryAlpha : 'rgba(23,58,94,0.08)',
                border: `1px solid ${saved ? 'rgba(92,138,118,0.30)' : isDirty ? C.primaryBorder : 'rgba(23,58,94,0.18)'}`,
                fontSize: 13, fontWeight: 700,
                color: saved ? '#5C8A76' : isDirty ? C.primary : C.hint,
                transition: 'all 0.18s',
              }}
            >
              <Check size={15} strokeWidth={2.5} />
              {saved ? '已儲存' : '儲存變更'}
            </button>
          </div>
        </div>

        {/* ── 錯誤訊息（獨立於 header 之外）────────────────────── */}
        {saveError && (
          <div style={{
            padding: '10px 14px', borderRadius: 10, marginBottom: 16,
            backgroundColor: 'rgba(233,76,120,0.10)', border: '1px solid rgba(233,76,120,0.30)',
            fontSize: 13, color: '#173A5E',
          }}>{saveError}</div>
        )}

        {/* ── 兩欄 Layout ────────────────────────────────────────── */}
        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? 20 : 28,
          alignItems: 'flex-start',
          marginTop: 20,
        }}>

          {/* ── 左欄： Nav + 登出 ──────────────────────────── */}
          <div style={{
            width: isMobile ? '100%' : 300,
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
            marginTop: isMobile ? 0 : 10,
          }}>

            {/* Nav */}
            {isMobile ? (
              <div style={{
                display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4,
                scrollbarWidth: 'none',
              }}>
                {NAV.map(({ key, Icon }) => {
                  const active = activeSection === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setActiveSection(key)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 7,
                        padding: '9px 16px', borderRadius: 99, flexShrink: 0,
                        cursor: 'pointer', border: `1px solid ${active ? C.primaryBorder : C.glassBorder}`,
                        backgroundColor: active ? C.primaryAlpha : C.glass,
                        fontSize: 13, fontWeight: active ? 700 : 500,
                        color: active ? C.primary : C.muted,
                        transition: 'all 0.15s',
                      }}
                    >
                      <Icon size={14} strokeWidth={2} />
                      {key}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div style={{ ...card, padding: 8 }}>
                {NAV.map(({ key, Icon, desc }) => {
                  const active = activeSection === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setActiveSection(key)}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                        padding: '11px 14px', borderRadius: 12, cursor: 'pointer',
                        border: 'none', textAlign: 'left',
                        backgroundColor: active ? C.primaryAlpha : 'transparent',
                        transition: 'background-color 0.15s',
                      }}
                    >
                      <div style={{
                        width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                        backgroundColor: active ? C.primaryBorder : 'rgba(23,58,94,0.10)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'background-color 0.15s',
                      }}>
                        <Icon size={16} color={active ? C.primary : C.muted} strokeWidth={2} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: active ? 700 : 500, color: active ? C.primary : C.text, marginBottom: 1 }}>{key}</p>
                        <p style={{ fontSize: 11, color: C.hint, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{desc}</p>
                      </div>
                      <ChevronRight size={14} color={active ? C.primary : C.hint} />
                    </button>
                  );
                })}
              </div>
            )}

            {/* 登出 — 桌面版才顯示在左欄 */}
            {!isMobile && (
            <button onClick={handleLogout} style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '13px 0', borderRadius: 14, cursor: 'pointer',
              backgroundColor: 'rgba(196,97,74,0.14)', border: '1.5px solid rgba(196,97,74,0.32)',
              fontSize: 14, fontWeight: 700, color: C.coral,
              transition: 'all 0.15s',
            }}>
              <LogOut size={16} strokeWidth={2} />
              登出帳號
            </button>
            )}
          </div>{/* 左欄結束 */}

          {/* ── 右欄：Section 內容 ─────────────────────────────────── */}
          <SettingsSections
            activeSection={activeSection}
            isMobile={isMobile}
            user={user}
            avatarUrl={avatarUrl}
            setAvatarUrl={setAvatarUrl}
            editMode={editMode}
            editUsername={editUsername}
            setEditUsername={setEditUsername}
            editEmail={editEmail}
            setEditEmail={setEditEmail}
            editBirthDate={editBirthDate}
            setEditBirthDate={setEditBirthDate}
            handleEditSave={handleEditSave}
            handleEditCancel={handleEditCancel}
            handleEditStart={handleEditStart}
            username={username}
            email={email}
            setShowDeleteModal={setShowDeleteModal}
            twoFactor={twoFactor}
            setTwoFactor={setTwoFactor}
            passwordChangedAgo={passwordChangedAgo}
            showCurrentPw={showCurrentPw}
            setShowCurrentPw={setShowCurrentPw}
            currentPassword={currentPassword}
            setCurrentPassword={setCurrentPassword}
            showNewPw={showNewPw}
            setShowNewPw={setShowNewPw}
            newPassword={newPassword}
            setNewPassword={setNewPassword}
            showConfirmPw={showConfirmPw}
            setShowConfirmPw={setShowConfirmPw}
            newPasswordConfirm={newPasswordConfirm}
            setNewPasswordConfirm={setNewPasswordConfirm}
            handleSave={handleSave}
            profileGender={profileGender}
            setProfileGender={setProfileGender}
            profileDistrict={profileDistrict}
            setProfileDistrict={setProfileDistrict}
            profileSensitivity={profileSensitivity}
            setProfileSensitivity={setProfileSensitivity}
            conditions={conditions}
            setConditions={setConditions}
            notifs={notifs}
            setNotifs={setNotifs}
          />

        </div>{/* 兩層Layout結束 */}

        {/* ── 登出按鈕（mobile 移到最底部）─────────────────────── */}
        {isMobile && (
          <button onClick={handleLogout} style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            marginTop: 32,
            padding: '15px 0', borderRadius: 14, cursor: 'pointer',
            backgroundColor: 'rgba(196,97,74,0.14)', border: '1.5px solid rgba(196,97,74,0.32)',
            fontSize: 14, fontWeight: 700, color: C.coral,
            transition: 'all 0.15s',
            boxSizing: 'border-box',
          }}>
            <LogOut size={16} strokeWidth={2} />
            登出帳號
          </button>
        )}

    </div>

      {/* ── 刪除帳號確認 Modal ─────────────────────────────────── */}
      {showDeleteModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          backgroundColor: 'rgba(26,18,32,0.55)',
          backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px',
        }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowDeleteModal(false); }}
        >
          <div style={{
            ...card,
            padding: 32, maxWidth: 420, width: '100%',
            display: 'flex', flexDirection: 'column', gap: 20,
          }}>
            {/* 警示圖示 */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                backgroundColor: 'rgba(220,38,38,0.10)',
                border: '1.5px solid rgba(220,38,38,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Trash2 size={24} color="#DC2626" strokeWidth={2} />
              </div>
            </div>

            {/* 標題與說明 */}
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 18, fontWeight: 800, color: C.text, marginBottom: 8 }}>確認刪除帳號？</p>
              <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.7 }}>
                此操作將永久刪除您的帳號及所有相關資料，<br />
                <strong style={{ color: '#DC2626' }}>無法復原</strong>，請確認後再繼續。
              </p>
            </div>

            {/* 按鈕列 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
                style={{
                  width: '100%', padding: '13px 0', borderRadius: 12, cursor: deleteLoading ? 'default' : 'pointer',
                  backgroundColor: deleteLoading ? 'rgba(220,38,38,0.05)' : 'rgba(220,38,38,0.10)',
                  border: '1.5px solid rgba(220,38,38,0.35)',
                  fontSize: 14, fontWeight: 700, color: '#DC2626',
                  opacity: deleteLoading ? 0.7 : 1,
                  transition: 'all 0.15s',
                }}
              >
                {deleteLoading ? '刪除中…' : '確認刪除帳號'}
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleteLoading}
                style={{
                  width: '100%', padding: '13px 0', borderRadius: 12, cursor: 'pointer',
                  backgroundColor: 'rgba(23,58,94,0.08)', border: `1.5px solid rgba(23,58,94,0.20)`,
                  fontSize: 14, fontWeight: 700, color: C.muted,
                  transition: 'all 0.15s',
                }}
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

  </div>
  </AuthGuard>
  );
}
