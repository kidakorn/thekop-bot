import React from 'react'
import { X, Rss } from 'lucide-react'

interface TutorialModalProps {
  type: 'facebook' | 'rss'
  isOpen: boolean
  onClose: () => void
}

export default function TutorialModal({ type, isOpen, onClose }: TutorialModalProps) {
  if (!isOpen) return null

  if (type === 'facebook') {
    return (
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
      }}>
        <div style={{
          background: 'var(--bg-card)', borderRadius: 16, width: '100%', maxWidth: 600, maxHeight: '90vh',
          overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: '1px solid var(--border-main)'
        }}>
          <div style={{ padding: '24px 24px 16px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'var(--bg-card)', zIndex: 10 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700 }}>วิธีเอา Facebook Page Token (ไม่มีวันหมดอายุ)</h3>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
              <X size={20} />
            </button>
          </div>
          <div style={{ padding: 24, fontSize: 14, color: 'var(--text-main)', lineHeight: 1.6 }}>
            <ol style={{ paddingLeft: 20, margin: 0, display: 'flex', flexDirection: 'column', gap: 20 }}>
              <li>
                <strong style={{ fontSize: 15, color: '#1d4ed8' }}>วิธีหา Facebook Page ID ของคุณ</strong>
                <div style={{ marginTop: 4 }}>
                  1. เปิด Facebook ไปที่หน้าเพจของคุณ (เข้าในฐานะแอดมิน)<br />
                  2. คลิกที่แท็บ <b>About (เกี่ยวกับ)</b> &gt; <b>Page Transparency (ความโปร่งใสของเพจ)</b><br />
                  3. เลื่อนลงมาจะเจอ <b>Page ID (รหัสเพจ)</b> ที่เป็นตัวเลขยาวๆ ให้ก็อปปี้มาใส่ในช่องตั้งค่าได้เลย
                </div>
              </li>
              <hr style={{ border: 0, borderTop: '1px dashed var(--border-light)', margin: '4px 0' }} />
              <li>
                <strong>สร้าง App ใน Facebook Developers</strong>
                <div style={{ marginTop: 4 }}>
                  1. เข้าเว็บ <a href="https://developers.facebook.com/" target="_blank" rel="noreferrer" style={{ color: '#3b82f6' }}>developers.facebook.com</a> แล้วล็อกอินด้วยบัญชี Facebook<br />
                  2. คลิกปุ่ม <b>My Apps (แอปของฉัน)</b> ที่มุมขวาบน<br />
                  3. คลิกปุ่ม <b>Create App (สร้างแอป)</b> สีเขียวๆ<br />
                  4. เลือก <b>Other (อื่นๆ)</b> แล้วกด Next<br />
                  5. เลือกประเภทแอปเป็น <b>Business (ธุรกิจ)</b> แล้วกด Next<br />
                  6. ตั้งชื่อแอป (เช่น บอทโพสต์ข่าว) ใส่อีเมลของคุณ แล้วกด <b>Create app</b>
                </div>
              </li>
              <li>
                <strong>เพิ่มผลิตภัณฑ์ Facebook Login for Business</strong>
                <div style={{ marginTop: 4 }}>
                  1. พอสร้างแอปเสร็จ ระบบจะพามาหน้า App Dashboard<br />
                  2. เลื่อนลงมาหาเมนู <b>Add a Product (เพิ่มผลิตภัณฑ์)</b><br />
                  3. หาการ์ดที่ชื่อว่า <b>Facebook Login for Business</b> แล้วกดปุ่ม <b>Set Up (ตั้งค่า)</b><br />
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>(เมื่อกดแล้วไม่ต้องทำอะไรต่อในหน้านั้น ให้ทำข้อถัดไปได้เลย)</span>
                </div>
              </li>
              <li>
                <strong>สร้าง Short-lived Token (อายุสั้น)</strong>
                <div>ไปที่เครื่องมือ <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noreferrer" style={{ color: '#3b82f6' }}>Graph API Explorer</a></div>
                <ul style={{ paddingLeft: 20, marginTop: 4, color: 'var(--text-muted)', listStyleType: 'disc' }}>
                  <li>ช่อง Facebook App: เลือก App ที่เพิ่งสร้าง</li>
                  <li>ช่อง User or Page: เลือก <b>&quot;Get Page Access Token&quot;</b> แล้วคลิกเลือกเพจของคุณ</li>
                  <li>ช่อง Permissions: พิมพ์เพิ่ม <code>pages_manage_posts</code> และ <code>pages_read_engagement</code></li>
                  <li>กดปุ่ม <b>Generate Access Token</b> แล้วก็อปปี้ Token ที่ได้มาเก็บไว้</li>
                </ul>
              </li>
              <li>
                <strong>แปลงเป็น Long-lived Token (อายุ 60 วัน)</strong>
                <div>ไปที่หน้า <a href="https://developers.facebook.com/tools/debug/accesstoken/" target="_blank" rel="noreferrer" style={{ color: '#3b82f6' }}>Access Token Debugger</a> เอา Token จากข้อที่แล้วไปวาง กด <b>Debug</b> แล้วเลื่อนลงมากดปุ่ม <b>Extend Access Token</b> จะได้ Token ใหม่ที่ยาวกว่าเดิม ให้ก็อปปี้ไว้</div>
              </li>
              <li>
                <strong style={{ color: '#c2410c' }}>แปลงเป็น Permanent Token (ไม่มีวันหมดอายุ - สำคัญมาก!)</strong>
                <div style={{ background: 'var(--bg-main)', padding: 12, borderRadius: 8, marginTop: 8, fontFamily: 'monospace', fontSize: 12, overflowX: 'auto', border: '1px solid var(--border-light)', whiteSpace: 'nowrap' }}>
                  https://graph.facebook.com/v19.0/<b>&#123;PAGE_ID&#125;</b>?fields=access_token&amp;access_token=<b>&#123;LONG_LIVED_TOKEN_จากข้อ5&#125;</b>
                </div>
                <div style={{ marginTop: 8 }}>
                  1. ก็อปปี้ URL ด้านบนไปวางในโปรแกรมแกรมจดบันทึก (Notepad)<br />
                  2. เปลี่ยน <b>&#123;PAGE_ID&#125;</b> เป็นตัวเลข Page ID จากข้อ 1<br />
                  3. เปลี่ยน <b>&#123;LONG_LIVED_TOKEN_จากข้อ5&#125;</b> เป็น Token ที่ได้จากข้อ 5<br />
                  4. เอา URL ที่แก้เสร็จแล้วไปเปิดในช่องค้นหาเว็บ (Address Bar) ของเบราว์เซอร์ แล้วกด Enter<br />
                  5. หน้าเว็บจะแสดงข้อความยึกยือ (JSON) ให้หาคำว่า <code>&quot;access_token&quot;</code> <b>นำข้อความในเครื่องหมายคำพูดด้านหลังมาใช้ ถือเป็นอันเสร็จสิ้น! 🎉</b>
                </div>
              </li>
            </ol>
          </div>
          <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-light)', background: 'var(--bg-main)', display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={onClose} style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
              เข้าใจแล้ว ปิดหน้าต่าง
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (type === 'rss') {
    return (
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
      }}>
        <div style={{
          background: 'var(--bg-card)', borderRadius: 16, width: '100%', maxWidth: 500, maxHeight: '90vh',
          overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: '1px solid var(--border-main)'
        }}>
          <div style={{ padding: '24px 24px 16px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'var(--bg-card)', zIndex: 10 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700 }}>วิธีหาลิงก์ RSS ของเว็บข่าว</h3>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
              <X size={20} />
            </button>
          </div>
          <div style={{ padding: 24, fontSize: 14, color: 'var(--text-main)', lineHeight: 1.6 }}>
            <p style={{ marginBottom: 16 }}>
              RSS Feed คือช่องทางสำหรับดึงเนื้อหาจากเว็บไซต์มาใช้งานแบบอัตโนมัติ
              คุณสามารถนำ URL ของ RSS จากเว็บข่าวกีฬาที่คุณชอบมาใส่ในบอทนี้ได้
            </p>

            <h4 style={{ fontWeight: 600, fontSize: 15, marginBottom: 8, color: 'var(--text-strong)' }}>เคล็ดลับการหาลิงก์ RSS:</h4>
            <ol style={{ paddingLeft: 20, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <li>
                <strong>สังเกตสัญลักษณ์ RSS</strong>
                <div>มองหาไอคอน <Rss size={14} style={{ display: 'inline', color: '#f59e0b' }} /> หรือคำว่า &quot;RSS / Feed&quot; ที่ด้านล่างสุดของเว็บข่าว (Footer)</div>
              </li>
              <li>
                <strong>ลองเติม Path ต่อท้าย URL</strong>
                <div>ลองพิมพ์คำพวกนี้ต่อท้ายชื่อเว็บข่าวที่คุณชอบ:
                  <ul style={{ paddingLeft: 20, marginTop: 4, color: 'var(--text-muted)' }}>
                    <li><code>/rss</code> (เช่น <code>example.com/rss</code>)</li>
                    <li><code>/feed</code> (เช่น <code>example.com/feed</code>)</li>
                    <li><code>/rss.xml</code> (เช่น <code>example.com/rss.xml</code>)</li>
                  </ul>
                </div>
              </li>
              <li>
                <strong>ค้นหาผ่าน Google</strong>
                <div>ลองพิมพ์ค้นหาใน Google ว่า <code>&quot;ชื่อเว็บข่าว RSS Feed&quot;</code> เช่น <code>&quot;Sky Sports Liverpool RSS&quot;</code></div>
              </li>
            </ol>

            <div style={{ marginTop: 24, padding: 12, background: 'rgba(245, 158, 11, 0.1)', borderRadius: 8, border: '1px dashed #f59e0b' }}>
              <strong style={{ color: '#d97706', display: 'block', marginBottom: 4 }}>ตัวอย่าง RSS ที่ใช้ได้เลย:</strong>
              <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: 'var(--text-muted)' }}>
                <li>BBC Sport (LFC): <br /><code style={{ fontSize: 11 }}>https://www.bbc.co.uk/sport/football/teams/liverpool/rss.xml</code></li>
                <li>Liverpool Echo: <br /><code style={{ fontSize: 11 }}>https://www.liverpoolecho.co.uk/all-about/liverpool-fc?service=rss</code></li>
                <li>This Is Anfield: <br /><code style={{ fontSize: 11 }}>https://www.thisisanfield.com/feed/</code></li>
              </ul>
            </div>
          </div>
          <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-light)', background: 'var(--bg-main)', display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={onClose} style={{ background: '#f59e0b', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
              เข้าใจแล้ว ปิดหน้าต่าง
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}
