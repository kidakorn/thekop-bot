import { useState, useEffect } from 'react'
import useSWR from 'swr'
import { Plus, Trash2, Link as LinkIcon, BarChart3, Save, CheckCircle2, RefreshCw } from 'lucide-react'
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
      } catch (e) {
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 40 }}>
      {/* HEADER */}
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#f97316', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <ShoppingBagIcon /> Affiliate Monetization
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 6 }}>
          เพิ่มลิงก์สินค้าจาก Shopee Affiliate เพื่อรับค่าคอมมิชชั่นเมื่อมีคนคลิกซื้อ
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
        
        {/* LEFT COL: SETTINGS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Status Toggle */}
          <div className="table-card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 4px' }}>เปิดใช้งานระบบ Affiliate</h3>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>แนบลิงก์สินค้าลงในคอมเมนต์แบบอัตโนมัติ</div>
              </div>
              <label style={{ position: 'relative', display: 'inline-block', width: 50, height: 28 }}>
                <input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
                <span style={{
                  position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                  backgroundColor: enabled ? '#f97316' : '#ccc', transition: '.4s', borderRadius: 34
                }}>
                  <span style={{
                    position: 'absolute', content: '""', height: 20, width: 20, left: 4, bottom: 4,
                    backgroundColor: 'white', transition: '.4s', borderRadius: '50%',
                    transform: enabled ? 'translateX(22px)' : 'none'
                  }} />
                </span>
              </label>
            </div>
          </div>

          {/* Links Configuration */}
          <div className="table-card" style={{ padding: 24, opacity: enabled ? 1 : 0.6, pointerEvents: enabled ? 'auto' : 'none' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <LinkIcon size={18} color="#f97316" /> Shopee Links
            </h3>

            {links.map((link, idx) => (
              <div key={link.id} style={{ background: 'var(--bg-main)', padding: 16, borderRadius: 12, marginBottom: 12, border: '1px solid var(--border-light)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>ลิงก์ที่ {idx + 1}</span>
                  <button onClick={() => handleRemoveLink(idx)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                    <Trash2 size={15} />
                  </button>
                </div>
                
                <input 
                  type="text" placeholder="ชื่อสินค้า (เช่น เสื้อลิเวอร์พูล)" 
                  value={link.label} onChange={e => handleUpdateLink(idx, 'label', e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-main)', marginBottom: 12, fontSize: 13 }}
                />
                
                <input 
                  type="text" placeholder="Shopee Affiliate URL" 
                  value={link.url} onChange={e => handleUpdateLink(idx, 'url', e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-main)', fontSize: 13 }}
                />
              </div>
            ))}

            <button onClick={handleAddLink} style={{
              width: '100%', padding: '12px', background: 'rgba(249, 115, 22, 0.1)', color: '#ea580c',
              border: '1px dashed #f97316', borderRadius: 8, fontWeight: 600, cursor: 'pointer',
              display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, fontSize: 14
            }}>
              <Plus size={16} /> เพิ่มลิงก์สินค้า
            </button>
          </div>

          {/* Posting Mode & Format */}
          <div className="table-card" style={{ padding: 24, opacity: enabled ? 1 : 0.6, pointerEvents: enabled ? 'auto' : 'none' }}>
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 8px' }}>รูปแบบการสุ่มลิงก์ (Posting Mode)</h3>
              <select value={mode} onChange={e => setMode(e.target.value as any)} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-main)', fontSize: 14 }}>
                <option value="rotate">หมุนวนทีละลิงก์ (เรียงลำดับ)</option>
                <option value="random">สุ่มลิงก์ (Random)</option>
                <option value="fixed">โพสต์เฉพาะลิงก์แรกเสมอ</option>
              </select>
            </div>

            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 8px' }}>แคปชั่นก่อนลิงก์ (CTA Text)</h3>
              <input 
                type="text" placeholder="เช่น ช้อปสินค้า Liverpool แท้" 
                value={tag} onChange={e => setTag(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-main)', fontSize: 14 }}
              />
            </div>

            <div style={{ marginTop: 20, padding: 16, background: 'var(--bg-main)', borderRadius: 8, fontSize: 13, border: '1px dashed var(--border-main)' }}>
              <div style={{ color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600, fontSize: 11 }}>PREVIEW คอมเมนต์</div>
              <span style={{ color: '#0ea5e9' }}>{tag || 'ช้อปสินค้า Liverpool แท้'}</span> <br/>
              <span style={{ color: '#16a34a' }}>https://thekop.devakorn.com/r/...</span> #LFC
            </div>
          </div>

          <button onClick={handleSave} disabled={saving} style={{
            background: saved ? '#16a34a' : '#f97316', color: '#fff', border: 'none', padding: '14px', borderRadius: 8,
            fontWeight: 700, fontSize: 15, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8,
            transition: 'background 0.3s'
          }}>
            {saving ? <RefreshCw className="animate-spin" size={18} /> : saved ? <CheckCircle2 size={18} /> : <Save size={18} />}
            {saved ? 'บันทึกสำเร็จ!' : 'บันทึกการตั้งค่า Affiliate'}
          </button>
        </div>

        {/* RIGHT COL: ANALYTICS */}
        <div>
          <div className="table-card" style={{ padding: 24, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <BarChart3 size={18} color="#f97316" /> สถิติคนกดลิงก์ (7 วันย้อนหลัง)
            </h3>
            
            <div style={{ flex: 1, minHeight: 250 }}>
              {statsLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-muted)' }}>
                  Loading stats...
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats?.chartData || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-main)" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} dy={10} />
                    <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                    <Tooltip
                      contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-main)', borderRadius: 8, fontSize: 12 }}
                      cursor={{ fill: 'var(--bg-hover)' }}
                    />
                    <Bar dataKey="clicks" fill="#f97316" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border-light)' }}>
              <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 12 }}>ภาพรวมคลิกทั้งหมด: <span style={{ color: '#f97316', fontSize: 18, marginLeft: 8 }}>{stats?.totalClicks || 0}</span></h4>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  )
}

function ShoppingBagIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path>
      <path d="M3 6h18"></path>
      <path d="M16 10a4 4 0 0 1-8 0"></path>
    </svg>
  )
}
