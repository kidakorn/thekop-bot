import { useState, useEffect } from 'react'
import useSWR from 'swr'
import { Plus, Trash2, Link as LinkIcon, BarChart3, Save, CheckCircle2, RefreshCw, ShoppingBag, TrendingUp, MousePointerClick, Zap } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function AffiliateTab() {
  const { data: settings, mutate } = useSWR('/api/affiliate', fetcher)
  const { data: stats, isLoading: statsLoading } = useSWR('/api/affiliate/stats', fetcher)

  const [enabled, setEnabled] = useState(false)
  const [links, setLinks] = useState<{ id: string, url: string, label: string, platform: string }[]>([])
  const [mode, setMode] = useState<'random' | 'rotate' | 'fixed'>('random')
  const [tag, setTag] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (settings) {
      setEnabled(settings.affiliateEnabled || false)
      setMode(settings.affiliateMode || 'random')
      setTag(settings.affiliateTag || '')
      try {
        setLinks(settings.affiliateLinks ? JSON.parse(settings.affiliateLinks) : [])
      } catch {
        setLinks([])
      }
    }
  }, [settings])

  const handleAddLink = () => {
    setLinks([...links, { id: Math.random().toString(36).substring(7), url: '', label: '', platform: 'shopee' }])
  }

  const handleUpdateLink = (index: number, field: string, value: string) => {
    const newLinks = [...links]
    newLinks[index] = { ...newLinks[index], [field]: value }
    setLinks(newLinks)
  }

  const handleRemoveLink = (index: number) => {
    setLinks(links.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await fetch('/api/affiliate', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          affiliateEnabled: enabled,
          affiliateLinks: JSON.stringify(links.filter(l => l.url.trim() !== '')),
          affiliateMode: mode,
          affiliateTag: tag
        })
      })
      mutate()
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e) {
      console.error(e)
    }
    setSaving(false)
  }

  const totalClicks = stats?.totalClicks || 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 40 }}>

      {/* ── Page Header (matches other pages) ── */}
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-header-icon" style={{
            background: 'linear-gradient(135deg,#f97316,#ea580c)',
            boxShadow: '0 4px 14px rgba(249,115,22,0.35)'
          }}>
            <ShoppingBag size={22} color="#fff" />
          </div>
          <div>
            <div className="page-header-title">Affiliate Monetization</div>
            <div className="page-header-subtitle">แนบลิงก์สินค้า Shopee อัตโนมัติในทุกโพสต์เพื่อรับค่าคอมมิชชั่น</div>
          </div>
        </div>
      </div>

      {/* ── Stats Mini Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {/* Total Clicks */}
        <div className="stat-card" style={{ borderLeft: '4px solid #f97316' }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
            background: 'linear-gradient(135deg,#f97316,#ea580c)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(249,115,22,0.35)'
          }}>
            <MousePointerClick size={20} color="#fff" />
          </div>
          <div className="stat-card-content">
            <div className="stat-card-label">Total Clicks</div>
            <div className="stat-card-value" style={{ fontSize: 28 }}>{statsLoading ? '—' : totalClicks}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>7 วันล่าสุด</div>
          </div>
        </div>
        {/* Active Links */}
        <div className="stat-card" style={{ borderLeft: '4px solid #10b981' }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
            background: 'linear-gradient(135deg,#10b981,#059669)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(16,185,129,0.35)'
          }}>
            <LinkIcon size={20} color="#fff" />
          </div>
          <div className="stat-card-content">
            <div className="stat-card-label">Active Links</div>
            <div className="stat-card-value" style={{ fontSize: 28 }}>{links.filter(l => l.url.trim()).length}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>จากทั้งหมด {links.length} ลิงก์</div>
          </div>
        </div>
        {/* Status */}
        <div className="stat-card" style={{ borderLeft: `4px solid ${enabled ? '#8b5cf6' : '#9ca3af'}` }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
            background: enabled ? 'linear-gradient(135deg,#8b5cf6,#7c3aed)' : 'linear-gradient(135deg,#9ca3af,#6b7280)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: enabled ? '0 4px 12px rgba(139,92,246,0.35)' : 'none'
          }}>
            <Zap size={20} color="#fff" />
          </div>
          <div className="stat-card-content">
            <div className="stat-card-label">สถานะ</div>
            <div className="stat-card-value" style={{ fontSize: 20, paddingTop: 4 }}>
              {enabled ? 'เปิดอยู่' : 'ปิดอยู่'}
            </div>
            <div style={{ fontSize: 11, marginTop: 4 }}>
              <span style={{
                background: enabled ? '#f3e8ff' : '#f3f4f6',
                color: enabled ? '#7c3aed' : '#6b7280',
                padding: '1px 7px', borderRadius: 20, fontWeight: 700
              }}>
                {enabled ? 'AUTO' : 'OFF'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Two-column layout ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>

        {/* LEFT: Settings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Bot Behaviour */}
          <div className="table-card">
            <div className="table-card-header">
              <div className="table-card-title">Bot Behaviour</div>
              <div className="table-card-meta">ควบคุมการทำงานของระบบ Affiliate</div>
            </div>

            {/* Enable Toggle */}
            <div className="ios-toggle-wrap">
              <div className="ios-toggle-info">
                <div className="ios-toggle-label">
                  <span style={{ fontSize: 16 }}>🛍️</span>
                  เปิดระบบ Affiliate
                </div>
                <div className="ios-toggle-desc">แนบลิงก์สินค้าลงในคอมเมนต์แรกของทุกโพสต์อัตโนมัติ</div>
              </div>
              <label className="ios-toggle">
                <input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} />
                <span className="ios-toggle-slider" style={{ background: enabled ? '#f97316' : undefined }} />
              </label>
            </div>
          </div>

          {/* Affiliate Links */}
          <div className="table-card" style={{ opacity: enabled ? 1 : 0.55, pointerEvents: enabled ? 'auto' : 'none', transition: 'opacity 0.2s' }}>
            <div className="table-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg,#f97316,#ea580c)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <LinkIcon size={14} color="#fff" />
                </div>
                <div className="table-card-title">Shopee Links</div>
              </div>
              <span style={{ fontSize: 11, background: '#fff7ed', color: '#ea580c', padding: '2px 8px', borderRadius: 20, fontWeight: 700, border: '1px solid #fed7aa' }}>
                {links.filter(l => l.url.trim()).length} active
              </span>
            </div>

            <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {links.map((link, idx) => (
                <div key={link.id} style={{
                  background: 'var(--bg-hover)', padding: 14, borderRadius: 10,
                  border: '1px solid var(--border-light)', position: 'relative'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, color: '#ea580c',
                      background: '#fff7ed', padding: '2px 8px', borderRadius: 20, border: '1px solid #fed7aa'
                    }}>
                      ลิงก์ #{idx + 1}
                    </span>
                    <button onClick={() => handleRemoveLink(idx)} style={{
                      background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer',
                      padding: 4, borderRadius: 6, transition: 'color 0.15s'
                    }}
                      onMouseOver={e => (e.currentTarget.style.color = '#ef4444')}
                      onMouseOut={e => (e.currentTarget.style.color = '#9ca3af')}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <input
                    type="text" placeholder="ชื่อสินค้า (เช่น เสื้อลิเวอร์พูล)"
                    value={link.label} onChange={e => handleUpdateLink(idx, 'label', e.target.value)}
                    style={{
                      width: '100%', padding: '8px 12px', borderRadius: 8,
                      border: '1px solid var(--border-main)', marginBottom: 8, fontSize: 13,
                      background: 'var(--bg-card)', color: 'var(--text-main)', outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  <input
                    type="text" placeholder="Shopee Affiliate URL (https://s.shopee.co.th/...)"
                    value={link.url} onChange={e => handleUpdateLink(idx, 'url', e.target.value)}
                    style={{
                      width: '100%', padding: '8px 12px', borderRadius: 8,
                      border: '1px solid var(--border-main)', fontSize: 13,
                      background: 'var(--bg-card)', color: 'var(--text-main)', outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              ))}

              <button onClick={handleAddLink} style={{
                width: '100%', padding: '12px', background: 'rgba(249, 115, 22, 0.06)', color: '#ea580c',
                border: '1px dashed #f97316', borderRadius: 8, fontWeight: 600, cursor: 'pointer',
                display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, fontSize: 13,
                transition: 'background 0.15s'
              }}
                onMouseOver={e => (e.currentTarget.style.background = 'rgba(249,115,22,0.12)')}
                onMouseOut={e => (e.currentTarget.style.background = 'rgba(249,115,22,0.06)')}
              >
                <Plus size={15} /> เพิ่มลิงก์สินค้า
              </button>
            </div>
          </div>

          {/* Mode & CTA */}
          <div className="table-card" style={{ opacity: enabled ? 1 : 0.55, pointerEvents: enabled ? 'auto' : 'none', transition: 'opacity 0.2s' }}>
            <div className="table-card-header">
              <div className="table-card-title">Posting Mode & CTA</div>
            </div>
            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text-strong)' }}>
                  รูปแบบการสุ่มลิงก์
                </label>
                <select value={mode} onChange={e => setMode(e.target.value as 'random' | 'rotate' | 'fixed')} style={{
                  width: '100%', padding: '10px 12px', borderRadius: 8,
                  border: '1px solid var(--border-main)', fontSize: 13,
                  background: 'var(--bg-card)', color: 'var(--text-main)', outline: 'none'
                }}>
                  <option value="rotate">🔄 หมุนวนทีละลิงก์ (เรียงลำดับ)</option>
                  <option value="random">🎲 สุ่มลิงก์ (Random)</option>
                  <option value="fixed">📌 โพสต์เฉพาะลิงก์แรกเสมอ</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text-strong)' }}>
                  แคปชั่นก่อนลิงก์ (CTA Text)
                </label>
                <input
                  type="text" placeholder="เช่น ช้อปสินค้า Liverpool แท้"
                  value={tag} onChange={e => setTag(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: 8,
                    border: '1px solid var(--border-main)', fontSize: 13,
                    background: 'var(--bg-card)', color: 'var(--text-main)', outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              {/* Comment Preview */}
              <div style={{
                padding: 14, background: 'var(--bg-hover)', borderRadius: 10,
                border: '1px solid var(--border-light)'
              }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-muted-light)', marginBottom: 8 }}>
                  PREVIEW คอมเมนต์
                </div>
                <span style={{ color: '#0ea5e9', fontSize: 13 }}>{tag || 'ช้อปสินค้า Liverpool แท้'}</span><br />
                <span style={{ color: '#16a34a', fontSize: 13 }}>https://s.shopee.co.th/...</span>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <button onClick={handleSave} disabled={saving} style={{
            background: saved ? '#16a34a' : 'linear-gradient(135deg,#f97316,#ea580c)',
            color: '#fff', border: 'none', padding: '14px 20px', borderRadius: 10,
            fontWeight: 700, fontSize: 14, cursor: 'pointer',
            display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8,
            boxShadow: saved ? '0 4px 12px rgba(22,163,74,0.3)' : '0 4px 14px rgba(249,115,22,0.35)',
            transition: 'all 0.3s', opacity: saving ? 0.8 : 1
          }}>
            {saving ? <RefreshCw className="animate-spin" size={16} /> : saved ? <CheckCircle2 size={16} /> : <Save size={16} />}
            {saved ? 'บันทึกสำเร็จ! ✓' : saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า Affiliate'}
          </button>
        </div>

        {/* RIGHT: Analytics Chart */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="table-card" style={{ flex: 1 }}>
            <div className="table-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: 'linear-gradient(135deg,#f97316,#ea580c)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <BarChart3 size={14} color="#fff" />
                </div>
                <div className="table-card-title">สถิติคนกดลิงก์ (7 วัน)</div>
              </div>
              <span style={{
                fontSize: 13, fontWeight: 800, color: '#f97316',
                background: '#fff7ed', padding: '3px 10px', borderRadius: 20, border: '1px solid #fed7aa'
              }}>
                {totalClicks} คลิก
              </span>
            </div>

            <div style={{ padding: '20px', height: 260 }}>
              {statsLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-muted)', flexDirection: 'column', gap: 8 }}>
                  <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite' }} />
                  <span style={{ fontSize: 13 }}>Loading stats...</span>
                </div>
              ) : (stats?.chartData?.length > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats?.chartData || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-main)" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} dy={10} />
                    <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                    <Tooltip
                      contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-main)', borderRadius: 10, fontSize: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                      cursor={{ fill: 'var(--bg-hover)' }}
                    />
                    <Bar dataKey="clicks" name="คลิก" fill="url(#orangeGrad)" radius={[6, 6, 0, 0]} barSize={32}>
                      <defs>
                        <linearGradient id="orangeGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f97316" stopOpacity={0.9} />
                          <stop offset="100%" stopColor="#f97316" stopOpacity={0.4} />
                        </linearGradient>
                      </defs>
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="empty-state" style={{ padding: 0, height: '100%' }}>
                  <TrendingUp size={30} strokeWidth={1.5} color="#f97316" />
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)' }}>ยังไม่มีข้อมูลคลิก</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted-light)' }}>สถิติจะแสดงเมื่อมีคนคลิกลิงก์</div>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
