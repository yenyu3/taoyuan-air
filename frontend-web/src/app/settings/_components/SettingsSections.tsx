'use client';

import React from 'react';
import Image from 'next/image';
import { Bell, Camera, Check, CheckCircle2, Eye, EyeOff, Heart, Key, Shield, Star, Trash2, Wind } from 'lucide-react';
import { C, FieldRow, SectionLabel, ToggleRow, card, type Section } from './SettingsParts';

type SettingsUser = {
  username?: string | null;
  birth_date?: string | Date | null;
  created_at?: string | Date | null;
};

type SettingsSectionsProps = {
  activeSection: Section; isMobile: boolean; user: SettingsUser | null; avatarUrl: string | null; setAvatarUrl: (value: string | null) => void;
  editMode: boolean; editUsername: string; setEditUsername: (value: string) => void; editEmail: string; setEditEmail: (value: string) => void;
  editBirthDate: string; setEditBirthDate: (value: string) => void; handleEditSave: () => void; handleEditCancel: () => void; handleEditStart: () => void;
  username: string; email: string; setShowDeleteModal: (value: boolean) => void; twoFactor: boolean; setTwoFactor: (value: boolean) => void; passwordChangedAgo: string;
  showCurrentPw: boolean; setShowCurrentPw: React.Dispatch<React.SetStateAction<boolean>>; currentPassword: string; setCurrentPassword: (value: string) => void;
  showNewPw: boolean; setShowNewPw: React.Dispatch<React.SetStateAction<boolean>>; newPassword: string; setNewPassword: (value: string) => void;
  showConfirmPw: boolean; setShowConfirmPw: React.Dispatch<React.SetStateAction<boolean>>; newPasswordConfirm: string; setNewPasswordConfirm: (value: string) => void;
  handleSave: () => void; profileGender: string; setProfileGender: (value: string) => void; profileDistrict: string; setProfileDistrict: (value: string) => void;
  profileSensitivity: string; setProfileSensitivity: (value: string) => void; conditions: { asthma: boolean; elderly: boolean; child: boolean }; setConditions: React.Dispatch<React.SetStateAction<{ asthma: boolean; elderly: boolean; child: boolean }>>; notifs: { pm25: boolean; aqi: boolean; health: boolean; system: boolean }; setNotifs: React.Dispatch<React.SetStateAction<{ pm25: boolean; aqi: boolean; health: boolean; system: boolean }>>;
};

export function SettingsSections(props: SettingsSectionsProps) {
  const { activeSection, isMobile, user, avatarUrl, setAvatarUrl, editMode, editUsername, setEditUsername, editEmail, setEditEmail, editBirthDate, setEditBirthDate, handleEditSave, handleEditCancel, handleEditStart, username, email, setShowDeleteModal, twoFactor, setTwoFactor, passwordChangedAgo, showCurrentPw, setShowCurrentPw, currentPassword, setCurrentPassword, showNewPw, setShowNewPw, newPassword, setNewPassword, showConfirmPw, setShowConfirmPw, newPasswordConfirm, setNewPasswordConfirm, handleSave, profileGender, setProfileGender, profileDistrict, setProfileDistrict, profileSensitivity, setProfileSensitivity, conditions, setConditions, notifs, setNotifs } = props;
  return (
    <>
          <div style={{ flex: 1, minWidth: 0, width: '100%', boxSizing: 'border-box' }}>

            {/* ── 基本資料 ── */}
            {activeSection === '基本資料' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <SectionLabel title="基本資料" />

                <div style={{ ...card, padding: 28 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 20 }}>基本資料</p>

                  {/* 頭像 */}
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
                    <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => document.getElementById('avatar-upload')?.click()}>
                      <div style={{
                        width: 80, height: 80, borderRadius: '50%',
                        backgroundColor: '#D4B896', color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 28, fontWeight: 800,
                        boxShadow: '0 6px 20px rgba(94,42,66,0.14)',
                        overflow: 'hidden',
                      }}>
                        {avatarUrl ? (
                          <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                            <Image src={avatarUrl} alt="avatar" fill sizes="80px" style={{ objectFit: 'cover' }} />
                          </div>
                        ) : (
                          user?.username ? user.username.split(' ').map((n: string) => n[0]).slice(0, 2).join('') : 'U'
                        )}
                      </div>
                      <div style={{
                        position: 'absolute', bottom: 0, right: 0,
                        width: 24, height: 24, borderRadius: '50%',
                        backgroundColor: C.primary, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                      }}>
                        <Camera size={12} color="#fff" strokeWidth={2.5} />
                      </div>
                      <input
                        id="avatar-upload" type="file" accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) setAvatarUrl(URL.createObjectURL(file));
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {editMode ? (
                      <>
                        {/* 用戶名稱 input */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: C.hint, letterSpacing: 0.8 }}>用戶名稱</span>
                          <input
                            type="text"
                            value={editUsername}
                            onChange={(e) => setEditUsername(e.target.value)}
                            style={{
                              padding: '11px 14px', borderRadius: 12,
                              border: `1.5px solid ${C.primaryBorder}`,
                              backgroundColor: 'rgba(255,255,255,0.85)',
                              fontSize: 14, color: C.text, fontWeight: 500,
                              fontFamily: 'inherit', outline: 'none', width: '100%', boxSizing: 'border-box',
                            }}
                          />
                        </div>
                        {/* 電子信箱 input */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: C.hint, letterSpacing: 0.8 }}>電子信箱</span>
                          <input
                            type="email"
                            value={editEmail}
                            onChange={(e) => setEditEmail(e.target.value)}
                            style={{
                              padding: '11px 14px', borderRadius: 12,
                              border: `1.5px solid ${C.primaryBorder}`,
                              backgroundColor: 'rgba(255,255,255,0.85)',
                              fontSize: 14, color: C.text, fontWeight: 500,
                              fontFamily: 'inherit', outline: 'none', width: '100%', boxSizing: 'border-box',
                            }}
                          />
                        </div>
                        {/* 出生年月日 input */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: C.hint, letterSpacing: 0.8 }}>出生年月日</span>
                          <input
                            type="date"
                            value={editBirthDate}
                            onChange={(e) => setEditBirthDate(e.target.value)}
                            max={new Date().toISOString().split('T')[0]}
                            style={{
                              padding: '11px 14px', borderRadius: 12,
                              border: `1.5px solid ${C.primaryBorder}`,
                              backgroundColor: 'rgba(255,255,255,0.85)',
                              fontSize: 14, color: C.text, fontWeight: 500,
                              fontFamily: 'inherit', outline: 'none', width: '100%', boxSizing: 'border-box',
                            }}
                          />
                        </div>
                        {/* 編輯模式按鈕列 */}
                        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                          <button
                            onClick={handleEditSave}
                            style={{
                              flex: 1, padding: '11px 0', borderRadius: 12, cursor: 'pointer',
                              backgroundColor: C.primaryAlpha, border: `1.5px solid ${C.primaryBorder}`,
                              fontSize: 13, fontWeight: 700, color: C.primary,
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            }}
                          >
                            <Check size={14} strokeWidth={2.5} />
                            儲存變更
                          </button>
                          <button
                            onClick={handleEditCancel}
                            style={{
                              flex: 1, padding: '11px 0', borderRadius: 12, cursor: 'pointer',
                              backgroundColor: 'rgba(23,58,94,0.08)', border: `1.5px solid rgba(23,58,94,0.20)`,
                              fontSize: 13, fontWeight: 700, color: C.muted,
                            }}
                          >
                            取消
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <FieldRow label="用戶名稱" value={username || '—'} />
                        <FieldRow label="電子信箱" value={email || '—'} />
                        <div style={{ display: 'flex', flexDirection: 'row', gap: 12 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <FieldRow
                              label="出生年月日"
                              value={user?.birth_date
                                ? new Date(String(user.birth_date)).toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' })
                                : '—'}
                            />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <FieldRow
                              label="年齡"
                              value={user?.birth_date ? (() => {
                                const birth = new Date(String(user.birth_date));
                                const today = new Date();
                                let age = today.getFullYear() - birth.getFullYear();
                                const m = today.getMonth() - birth.getMonth();
                                if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
                                return `${age} 歲`;
                              })() : '—'}
                            />
                          </div>
                        </div>
                        
                        <FieldRow
                          label="帳號建立日期"
                          value={user?.created_at ? new Date(user.created_at).toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
                        />
                        {/* 編輯按鈕 */}
                        <button
                          onClick={handleEditStart}
                          style={{
                            marginTop: 4, padding: '11px 0', borderRadius: 12, cursor: 'pointer',
                            backgroundColor: C.primaryAlpha, border: `1.5px solid ${C.primaryBorder}`,
                            fontSize: 13, fontWeight: 700, color: C.primary,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                          }}
                        >
                          編輯個人資料
                        </button>
                      </>
                    )}
                  </div>

                  {/* 刪除帳號 */}
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 40,
                    padding: '13px 0', borderRadius: 14, cursor: 'pointer',
                    backgroundColor: 'rgba(220,38,38,0.08)', border: '1.5px dashed rgba(220,38,38,0.40)',
                    fontSize: 14, fontWeight: 700, color: '#DC2626',
                    transition: 'all 0.15s',
                  }}>
                    <Trash2 size={16} strokeWidth={2} />
                    刪除帳號
                  </button>
                </div>

              </div>
            )}

            {/* ── 帳戶安全 ── */}
            {activeSection === '帳戶安全' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <SectionLabel title="帳戶安全" />

                <div style={{ ...card, padding: 28 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 20 }}>登入安全</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <ToggleRow
                      Icon={Key} iconColor={C.primary} iconBg={C.primaryAlpha}
                      title="雙因素驗證" desc="使用驗證器 App 進行第二步驟確認"
                      value={twoFactor} onChange={setTwoFactor}
                    />
                    <div style={{ height: 1, backgroundColor: 'rgba(23,58,94,0.12)' }} />
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <p style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 2 }}>登入密碼</p>
                          <p style={{ fontSize: 12, color: C.hint }}>
                            上次變更：{passwordChangedAgo}
                          </p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
                      {/* 目前密碼 */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: C.hint, letterSpacing: 0.8 }}>目前密碼</span>
                        <div style={{ position: 'relative' }}>
                          <input
                            type={showCurrentPw ? 'text' : 'password'}
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="••••••••"
                            style={{
                              padding: '11px 40px 11px 14px', borderRadius: 12,
                              border: `1px solid ${C.glassBorder}`,
                              backgroundColor: 'rgba(255,255,255,0.6)', fontSize: 14, color: C.text,
                              fontFamily: 'inherit', outline: 'none', width: '100%', boxSizing: 'border-box',
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPw(p => !p)}
                            style={{
                              position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                              background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: C.hint,
                            }}
                          >
                            {showCurrentPw ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>

                      {/* 新密碼 */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: C.hint, letterSpacing: 0.8 }}>新密碼（至少 8 碼）</span>
                        <div style={{ position: 'relative' }}>
                          <input
                            type={showNewPw ? 'text' : 'password'}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="••••••••"
                            style={{
                              padding: '11px 40px 11px 14px', borderRadius: 12,
                              border: `1px solid ${C.glassBorder}`,
                              backgroundColor: 'rgba(255,255,255,0.6)', fontSize: 14, color: C.text,
                              fontFamily: 'inherit', outline: 'none', width: '100%', boxSizing: 'border-box',
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPw(p => !p)}
                            style={{
                              position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                              background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: C.hint,
                            }}
                          >
                            {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>

                      {/* 確認新密碼 + 確認按鈕 */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: C.hint, letterSpacing: 0.8 }}>確認新密碼</span>
                        <div style={{ position: 'relative' }}>
                          <input
                            type={showConfirmPw ? 'text' : 'password'}
                            value={newPasswordConfirm}
                            onChange={(e) => setNewPasswordConfirm(e.target.value)}
                            placeholder="••••••••"
                            style={{
                              padding: '11px 40px 11px 14px', borderRadius: 12,
                              border: `1px solid ${
                                newPasswordConfirm && newPassword
                                  ? newPassword === newPasswordConfirm ? 'rgba(92,138,118,0.50)' : 'rgba(233,76,120,0.50)'
                                  : C.glassBorder
                              }`,
                              backgroundColor: 'rgba(255,255,255,0.6)', fontSize: 14, color: C.text,
                              fontFamily: 'inherit', outline: 'none', width: '100%', boxSizing: 'border-box',
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPw(p => !p)}
                            style={{
                              position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                              background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: C.hint,
                            }}
                          >
                            {showConfirmPw ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                        {/* 確認更改密碼按鈕 */}
                        <button
                          onClick={handleSave}
                          style={{
                            marginTop: 20, padding: '10px 0', borderRadius: 12, cursor: 'pointer',
                            backgroundColor: C.primaryAlpha, border: `1px solid ${C.primaryBorder}`,
                            fontSize: 13, fontWeight: 700, color: C.primary,
                          }}
                        >
                          確認更改密碼
                        </button>
                      </div>
                    </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── 身份驗證 ── */}
            {activeSection === '身份驗證' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <SectionLabel title="身份驗證" />
                <div style={{ ...card, padding: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {[
                    { label: '電子信箱驗證', sub: 'wei-ting.chen@taoyuan.io', done: true },
                    { label: '手機號碼綁定', sub: '+886 9xx-xxx-xxx', done: true },
                    { label: '政府機關身份認證', sub: '桃園市政府環保局人員', done: false },
                  ].map(({ label, sub, done }) => (
                    <div key={label} style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: '16px 18px', borderRadius: 14,
                      backgroundColor: done ? C.primaryAlpha : 'rgba(23,58,94,0.07)',
                      border: `1px solid ${done ? C.primaryBorder : 'rgba(23,58,94,0.15)'}`,
                    }}>
                      <CheckCircle2
                        size={22} strokeWidth={2}
                        color={done ? C.primary : C.hint}
                        fill={done ? C.primaryAlpha : 'none'}
                      />
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 14, fontWeight: 700, color: done ? C.text : C.muted, marginBottom: 2 }}>{label}</p>
                        <p style={{ fontSize: 12, color: C.hint }}>{sub}</p>
                      </div>
                      {!done && (
                        <button style={{
                          padding: '7px 16px', borderRadius: 99, cursor: 'pointer',
                          backgroundColor: C.primaryAlpha, border: `1px solid ${C.primaryBorder}`,
                          fontSize: 12, fontWeight: 700, color: C.primary,
                        }}>前往驗證</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── 健康檔案 ── */}
            {activeSection === '健康檔案' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <SectionLabel title="健康檔案設定" />

                <div style={{ ...card, padding: 28 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 20 }}>基本健康資訊</p>
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
                    


                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: C.hint, letterSpacing: 0.8 }}>性別</span>
                      <select value={profileGender} onChange={(e) => setProfileGender(e.target.value)}
                        style={{ padding: '11px 14px', borderRadius: 12, border: `1px solid ${C.glassBorder}`, backgroundColor: 'rgba(255,255,255,0.6)', fontSize: 14, color: C.text, fontFamily: 'inherit', outline: 'none', cursor: 'pointer' }}>
                        <option value="男性">男性</option>
                        <option value="女性">女性</option>
                        <option value="其他">其他</option>
                      </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: C.hint, letterSpacing: 0.8 }}>主要活動行政區</span>
                      <select value={profileDistrict} onChange={(e) => setProfileDistrict(e.target.value)}
                        style={{ padding: '11px 14px', borderRadius: 12, border: `1px solid ${C.glassBorder}`, backgroundColor: 'rgba(255,255,255,0.6)', fontSize: 14, color: C.text, fontFamily: 'inherit', outline: 'none', cursor: 'pointer' }}>
                        {['桃園區','中壢區','八德區','龜山區','蘆竹區','大園區','大溪區','平鎮區','楊梅區','龍潭區','觀音區','新屋區','復興區'].map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: C.hint, letterSpacing: 0.8 }}>敏感度預設</span>
                      <select value={profileSensitivity} onChange={(e) => setProfileSensitivity(e.target.value)}
                        style={{ padding: '11px 14px', borderRadius: 12, border: `1px solid ${C.glassBorder}`, backgroundColor: 'rgba(255,255,255,0.6)', fontSize: 14, color: C.text, fontFamily: 'inherit', outline: 'none', cursor: 'pointer' }}>
                        <option value="一般民眾">一般民眾</option>
                        <option value="敏感族群">敏感族群</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div style={{ ...card, padding: 28 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 20 }}>特殊健康狀況</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <ToggleRow
                      Icon={Wind} iconColor={C.primary} iconBg={C.primaryAlpha}
                      title="氣喘 / 呼吸道疾病" desc={<>調低 PM<sub style={{ fontSize: '0.75em' }}>2.5</sub> 警報門檻至 15 µg/m³</>}
                      value={conditions.asthma} onChange={(v) => setConditions(p => ({ ...p, asthma: v }))}
                    />
                    <div style={{ height: 1, backgroundColor: 'rgba(23,58,94,0.12)' }} />
                    <ToggleRow
                      Icon={Heart} iconColor={C.primary} iconBg={C.primaryAlpha}
                      title="年長者 (65 歲以上)" desc="啟用額外健康警示與建議"
                      value={conditions.elderly} onChange={(v) => setConditions(p => ({ ...p, elderly: v }))}
                    />
                    <div style={{ height: 1, backgroundColor: 'rgba(23,58,94,0.12)' }} />
                    <ToggleRow
                      Icon={Star} iconColor={C.primary} iconBg={C.primaryAlpha}
                      title="兒童 (12 歲以下)" desc="針對兒童調整戶外活動建議"
                      value={conditions.child} onChange={(v) => setConditions(p => ({ ...p, child: v }))}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ── 通知偏好 ── */}
            {activeSection === '通知偏好' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <SectionLabel title="通知偏好設定" />

                <div style={{ ...card, padding: 28 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 20 }}>警報通知</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <ToggleRow
                      Icon={Shield} iconColor={C.primary} iconBg={C.primaryAlpha}
                      title={<>PM<sub style={{ fontSize: '0.75em' }}>2.5</sub> 超標警報</>} desc="濃度超過設定門檻時即時通知"
                      value={notifs.pm25} onChange={(v) => setNotifs(p => ({ ...p, pm25: v }))}
                    />
                    <div style={{ height: 1, backgroundColor: 'rgba(23,58,94,0.12)' }} />
                    <ToggleRow
                      Icon={Wind} iconColor={C.primary} iconBg={C.primaryAlpha}
                      title="AQI ????" desc="???? 7:00 ????????"
                      value={notifs.aqi} onChange={(v) => setNotifs(p => ({ ...p, aqi: v }))}
                    />
                  </div>
                </div>

                <div style={{ ...card, padding: 28 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 20 }}>其他通知</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <ToggleRow
                      Icon={Heart} iconColor={C.primary} iconBg={C.primaryAlpha}
                      title="??????" desc="AI ????????????"
                      value={notifs.health} onChange={(v) => setNotifs(p => ({ ...p, health: v }))}
                    />
                    <div style={{ height: 1, backgroundColor: 'rgba(23,58,94,0.12)' }} />
                    <ToggleRow
                      Icon={Bell} iconColor={C.primary} iconBg={C.primaryAlpha}
                      title="系統更新通知" desc="版本更新與新功能上線通報"
                      value={notifs.system} onChange={(v) => setNotifs(p => ({ ...p, system: v }))}
                    />
                  </div>
                </div>
              </div>
            )}

          </div>{/* 右欄結束 */}    </>

  );
}
