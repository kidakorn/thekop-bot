import React, { useState } from 'react'
import { Settings, X, Rss, Radio, RefreshCw } from 'lucide-react'
import { useSettings } from '../../hooks/useSettings'
import TutorialModal from './TutorialModal'

interface SettingsTabProps {
  isMobile: boolean
  showToast: (msg: string, type: 'success' | 'error') => void
}

export default function SettingsTab({ isMobile, showToast }: SettingsTabProps) {
  const {
    settingsData, mutateSettings,
    editedPageId, setEditedPageId,
    editedPageAccessToken, setEditedPageAccessToken,
    editedNews, setEditedNews,
    editedFeeds, setEditedFeeds,
    editedDisableAi, setEditedDisableAi,
    editedPostAsPhoto, setEditedPostAsPhoto,
    editedAddTextOnImage, setEditedAddTextOnImage,
    newNewsTime, setNewNewsTime,
    newFeedName, setNewFeedName,
    newFeedUrl, setNewFeedUrl,
    savingSettings, setSavingSettings
  } = useSettings()

  const [showTutorialModal, setShowTutorialModal] = useState(false)
  const [showRssTutorialModal, setShowRssTutorialModal] = useState(false)

  function addNewsTime() {
    if (!editedNews.includes(newNewsTime)) {
      setEditedNews([...editedNews, newNewsTime].sort())
    } else {
      showToast('เวลานี้มีอยู่ในตารางอยู่แล้ว', 'error')
    }
  }

  function removeNewsTime(time: string) {
    setEditedNews(editedNews.filter(t => t !== time))
  }

  function addFeed() {
    if (newFeedName.trim() && newFeedUrl.trim()) {
      setEditedFeeds([...editedFeeds, { name: newFeedName.trim(), url: newFeedUrl.trim() }])
      setNewFeedName('')
      setNewFeedUrl('')
    } else {
      showToast('กรุณากรอกชื่อและ URL ให้ครบถ้วน', 'error')
    }
  }

  function removeFeed(index: number) {
    setEditedFeeds(editedFeeds.filter((_, i) => i !== index))
  }

  async function handleSaveSettings() {
    setSavingSettings(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageId: editedPageId,
          pageAccessToken: editedPageAccessToken,
          news_schedule: editedNews,
          rss_feeds: editedFeeds,
          disable_ai: editedDisableAi,
          postAsPhoto: editedPostAsPhoto,
          addTextOnImage: editedAddTextOnImage
        })
      })

      if (!res.ok) {
        const err = await res.json()
        showToast(err.error ?? 'Failed to save settings', 'error')
        return
      }

      mutateSettings()
      showToast('บันทึกตั้งค่าตารางเวลาเรียบร้อยแล้ว', 'success')
    } catch (err) {
      console.error(err)
      showToast('เกิดข้อผิดพลาดในการเชื่อมต่อ', 'error')
    } finally {
      setSavingSettings(false)
    }
  }

  return (
    <>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-header-icon" style={{ background: 'linear-gradient(135deg,#8b5cf6,#C8102E)', boxShadow: '0 4px 14px rgba(139,92,246,0.35)' }}>
            <Settings size={22} color="#fff" />
          </div>
          <div>
            <div className="page-header-title">Settings</div>
            <div className="page-header-subtitle">ตั้งค่าการทำงานของบอทและการเชื่อมต่อ Facebook</div>
          </div>
        </div>
      </div>

      {/* Bot Behaviour Toggles */}
      <div className="table-card" style={{ marginBottom: 20 }}>
        <div className="table-card-header">
          <div className="table-card-title">Bot Behaviour</div>
          <div className="table-card-meta">ตั้งค่าพฤติกรรมของบอทในการโพสต์</div>
        </div>

        {/* Translation Toggle */}
        <div className="ios-toggle-wrap">
          <div className="ios-toggle-info">
            <div className="ios-toggle-label">
              <span style={{ fontSize: 16 }}>🌐</span>
              แปลข่าวเป็นภาษาไทย
            </div>
            <div className="ios-toggle-desc">เปิด = บอทแปลหัวข้อข่าวภาษาไทยอัตโนมัติ (ใช้ Google Translate ฟรี)</div>
          </div>
          <label className="ios-toggle">
            <input
              type="checkbox"
              checked={!editedDisableAi}
              onChange={async () => {
                const newVal = !editedDisableAi
                setEditedDisableAi(newVal)
                try {
                  await fetch('/api/settings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ news_schedule: editedNews, rss_feeds: editedFeeds, disable_ai: newVal, postAsPhoto: editedPostAsPhoto, addTextOnImage: editedAddTextOnImage })
                  })
                  mutateSettings()
                  showToast(newVal ? 'ปิดการแปลภาษาไทยแล้ว' : 'เปิดระบบแปลภาษาไทยแล้ว', 'success')
                } catch { showToast('Failed to save', 'error') }
              }}
            />
            <span className="ios-toggle-slider" />
          </label>
        </div>

        {/* Post Type Toggle */}
        <div className="ios-toggle-wrap">
          <div className="ios-toggle-info">
            <div className="ios-toggle-label">
              <span style={{ fontSize: 16 }}>🖼️</span>
              โพสต์แบบอัปโหลดรูป
            </div>
            <div className="ios-toggle-desc">ปิด = แชร์ลิงก์ (ปลอดภัยลิขสิทธิ์ 100%) · เปิด = อัปโหลดรูปโดยตรง (Reach สูงกว่า)</div>
          </div>
          <label className="ios-toggle">
            <input
              type="checkbox"
              checked={editedPostAsPhoto}
              onChange={async () => {
                const newVal = !editedPostAsPhoto
                setEditedPostAsPhoto(newVal)
                try {
                  await fetch('/api/settings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ pageId: editedPageId, pageAccessToken: editedPageAccessToken, news_schedule: editedNews, rss_feeds: editedFeeds, disable_ai: editedDisableAi, postAsPhoto: newVal, addTextOnImage: editedAddTextOnImage })
                  })
                  mutateSettings()
                  showToast(newVal ? 'เปลี่ยนเป็นโพสต์แบบอัปโหลดรูปแล้ว' : 'เปลี่ยนเป็นโพสต์แบบแชร์ลิงก์แล้ว', 'success')
                } catch { showToast('Failed to save', 'error') }
              }}
            />
            <span className="ios-toggle-slider" />
          </label>
        </div>

        {/* Add Text On Image Toggle */}
        {editedPostAsPhoto && (
          <div className="ios-toggle-wrap">
            <div className="ios-toggle-info">
              <div className="ios-toggle-label">
                <span style={{ fontSize: 16 }}>✍️</span>
                เขียนหัวข้อข่าวบนรูป
              </div>
              <div className="ios-toggle-desc">เปิด = พิมพ์ข้อความ Category และพาดหัวข่าวลงบนภาพอัตโนมัติ</div>
            </div>
            <label className="ios-toggle">
              <input
                type="checkbox"
                checked={editedAddTextOnImage}
                onChange={async () => {
                  const newVal = !editedAddTextOnImage
                  setEditedAddTextOnImage(newVal)
                  try {
                    await fetch('/api/settings', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ pageId: editedPageId, pageAccessToken: editedPageAccessToken, news_schedule: editedNews, rss_feeds: editedFeeds, disable_ai: editedDisableAi, postAsPhoto: editedPostAsPhoto, addTextOnImage: newVal })
                    })
                    mutateSettings()
                    showToast(newVal ? 'เปิดการเขียนตัวหนังสือบนภาพแล้ว' : 'ปิดการเขียนตัวหนังสือบนภาพแล้ว', 'success')
                  } catch { showToast('Failed to save', 'error') }
                }}
              />
              <span className="ios-toggle-slider" />
            </label>
          </div>
        )}
      </div>

      <div className="table-card" style={{ marginBottom: 20 }}>
        <div className="table-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div className="table-card-title">Facebook Page Integration</div>
            <div className="table-card-meta">ตั้งค่า Facebook Page ID และ Access Token ของเพจคุณ</div>
          </div>
          <button
            onClick={() => setShowTutorialModal(true)}
            style={{
              background: 'var(--bg-hover)', color: '#3b82f6', border: '1px solid #3b82f633',
              padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer'
            }}
          >
            วิธีดึง Token
          </button>
        </div>
        <div style={{ padding: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Facebook Page ID</label>
              <input
                type="text"
                value={editedPageId}
                onChange={e => setEditedPageId(e.target.value)}
                placeholder="e.g. 123456789012345"
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-main)',
                  background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: 14, outline: 'none'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Page Access Token (Long-lived)</label>
              <input
                type="password"
                value={editedPageAccessToken}
                onChange={e => setEditedPageAccessToken(e.target.value)}
                placeholder="EAACBGZCmVi..."
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-main)',
                  background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: 14, outline: 'none'
                }}
              />
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 6 }}>
                Token จะต้องเป็นแบบไม่มีวันหมดอายุ และมีสิทธิ์ pages_manage_posts, pages_read_engagement
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RSS Feeds Settings Card */}
      <div className="table-card" style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-strong)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Rss size={18} color="#f59e0b" />
              แหล่งที่มาของข่าว (RSS Sources)
            </h3>
            <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 4 }}>
              ตั้งค่า RSS Feed สำหรับให้บอทดึงข่าวอัตโนมัติ
            </div>
          </div>
          <button
            onClick={() => setShowRssTutorialModal(true)}
            style={{
              background: 'var(--bg-hover)', color: '#f59e0b', border: '1px solid #f59e0b33',
              padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer'
            }}
          >
            วิธีหาลิงก์ RSS
          </button>
        </div>

        <div style={{ height: 12 }} />

        {/* Add new feed row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          <input
            type="text"
            placeholder="ชื่อแหล่งข่าว (เช่น BBC Sport)"
            value={newFeedName}
            onChange={(e) => setNewFeedName(e.target.value)}
            style={{
              padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-main)',
              outline: 'none', background: 'var(--bg-hover)', fontSize: 14, flex: '1 1 200px'
            }}
          />
          <input
            type="url"
            placeholder="RSS URL (เช่น https://.../rss.xml)"
            value={newFeedUrl}
            onChange={(e) => setNewFeedUrl(e.target.value)}
            style={{
              padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-main)',
              outline: 'none', background: 'var(--bg-hover)', fontSize: 14, flex: '2 1 300px'
            }}
          />
          <button
            onClick={addFeed}
            className="btn-refresh"
            style={{ background: '#f59e0b', color: 'var(--bg-card)', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}
          >
            เพิ่มแหล่งข่าว
          </button>
        </div>

        {/* Feeds list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {editedFeeds.length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--text-muted)', width: '100%', textAlign: 'center', padding: '12px 0' }}>ไม่มีแหล่งข่าวในระบบ</div>
          ) : (
            editedFeeds.map((feed, idx) => (
              <div key={idx} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                background: 'var(--bg-card)', border: '1px solid var(--border-main)',
                borderRadius: 8, padding: '12px 16px'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-strong)' }}>{feed.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{feed.url}</div>
                </div>
                <button
                  onClick={() => removeFeed(idx)}
                  style={{
                    background: '#fef2f2', color: '#C8102E', border: 'none', borderRadius: 6,
                    padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', flexShrink: 0
                  }}
                >
                  ลบ
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Scheduler settings card */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* News Schedule Card */}
        <div className="table-card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-strong)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Radio size={18} color="#C8102E" />
            ตารางเวลาโพสต์ข่าว (News Schedule)
          </h3>
          <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 18 }}>ตั้งค่าช่วงเวลาโพสต์คอนเทนต์ข่าวลิเวอร์พูลปกติ</p>

          {/* Add new time row */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <input
              type="time"
              value={newNewsTime}
              onChange={(e) => setNewNewsTime(e.target.value)}
              style={{
                padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-main)',
                outline: 'none', background: 'var(--bg-hover)', fontSize: 14, flex: 1
              }}
            />
            <button
              onClick={addNewsTime}
              className="btn-refresh"
              style={{ background: '#C8102E', color: 'var(--bg-card)', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 600, cursor: 'pointer' }}
            >
              เพิ่มเวลา
            </button>
          </div>

          {/* Times list */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {editedNews.length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--text-muted)', width: '100%', textAlign: 'center', padding: '12px 0' }}>ไม่มีกำหนดเวลาโพสต์ข่าว</div>
            ) : (
              editedNews.map(time => (
                <span key={time} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: '#fef2f2', color: '#C8102E', border: '1px solid #fee2e2',
                  borderRadius: 6, padding: '5px 10px', fontSize: 13, fontWeight: 600
                }}>
                  {time}
                  <button
                    onClick={() => removeNewsTime(time)}
                    style={{ background: 'none', border: 'none', color: '#b91c1c', cursor: 'pointer', display: 'flex', padding: 0 }}
                    title="Remove time"
                  >
                    <X size={13} />
                  </button>
                </span>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Save Button Card */}
      <div className="table-card" style={{ padding: '16px 24px', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
        <button
          disabled={savingSettings}
          onClick={handleSaveSettings}
          className="btn-refresh"
          style={{
            background: '#C8102E', color: 'var(--bg-card)', border: 'none',
            borderRadius: 8, padding: '10px 24px', fontWeight: 600, fontSize: 14,
            cursor: 'pointer', opacity: savingSettings ? 0.7 : 1,
            display: 'flex', alignItems: 'center', gap: 8
          }}
        >
          {savingSettings ? <RefreshCw size={14} className="animate-spin" /> : null}
          บันทึกกำหนดเวลาทั้งหมด
        </button>
      </div>

      {/* Tutorial Modals */}
      <TutorialModal
        type="facebook"
        isOpen={showTutorialModal}
        onClose={() => setShowTutorialModal(false)}
      />
      <TutorialModal
        type="rss"
        isOpen={showRssTutorialModal}
        onClose={() => setShowRssTutorialModal(false)}
      />
    </>
  )
}
