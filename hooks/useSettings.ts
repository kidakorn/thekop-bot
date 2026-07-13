import useSWR from 'swr'
import { useState, useEffect } from 'react'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export interface SettingsData {
  pageId?: string
  pageAccessToken?: string
  news_schedule: string[]
  rss_feeds?: { name: string; url: string }[]
  disable_ai?: boolean
  postAsPhoto?: boolean
  addTextOnImage?: boolean
}

export function useSettings() {
  const { data: settingsData, mutate: mutateSettings, isLoading: settingsLoading } =
    useSWR<SettingsData>('/api/settings', fetcher)

  const [editedPageId, setEditedPageId] = useState('')
  const [editedPageAccessToken, setEditedPageAccessToken] = useState('')
  const [editedNews, setEditedNews] = useState<string[]>([])
  const [editedFeeds, setEditedFeeds] = useState<{ name: string; url: string }[]>([])
  const [editedDisableAi, setEditedDisableAi] = useState<boolean>(false)
  const [editedPostAsPhoto, setEditedPostAsPhoto] = useState<boolean>(false)
  const [editedAddTextOnImage, setEditedAddTextOnImage] = useState<boolean>(true)
  
  const [newNewsTime, setNewNewsTime] = useState('12:00')
  const [newFeedName, setNewFeedName] = useState('')
  const [newFeedUrl, setNewFeedUrl] = useState('')
  const [savingSettings, setSavingSettings] = useState(false)

  useEffect(() => {
    if (settingsData) {
      setEditedPageId(settingsData.pageId || '')
      setEditedPageAccessToken(settingsData.pageAccessToken || '')
      setEditedNews(settingsData.news_schedule || [])
      if (settingsData.rss_feeds) {
        setEditedFeeds(settingsData.rss_feeds)
      }
      if (typeof settingsData.disable_ai === 'boolean') {
        setEditedDisableAi(settingsData.disable_ai)
      }
      if (typeof settingsData.postAsPhoto === 'boolean') {
        setEditedPostAsPhoto(settingsData.postAsPhoto)
      }
      if (typeof settingsData.addTextOnImage === 'boolean') {
        setEditedAddTextOnImage(settingsData.addTextOnImage)
      }
    }
  }, [settingsData])

  const RSS_FEEDS = settingsData?.rss_feeds || [
    { name: 'BBC Sport — Liverpool', url: 'https://www.bbc.co.uk/sport/football/teams/liverpool/rss.xml' },
    { name: 'Liverpool Echo', url: 'https://www.liverpoolecho.co.uk/all-about/liverpool-fc?service=rss' },
    { name: 'LFC Official (Scraped)', url: 'https://www.liverpoolfc.com/news' },
  ]

  const activeSchedules = (() => {
    const news = settingsData?.news_schedule ?? ['08:00', '11:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00']
    const items: { time: string; label: string; isReel: boolean; cron: string }[] = []

    news.forEach(time => {
      const [h, m] = time.split(':')
      items.push({
        time,
        label: `${parseInt(h) < 12 ? 'Morning' : parseInt(h) < 17 ? 'Afternoon' : 'Evening'} News`,
        isReel: false,
        cron: `${parseInt(m)} ${parseInt(h)} * * * (Asia/Bangkok)`
      })
    })

    return items.sort((a, b) => a.time.localeCompare(b.time))
  })()

  return {
    settingsData,
    mutateSettings,
    settingsLoading,
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
    savingSettings, setSavingSettings,
    RSS_FEEDS,
    activeSchedules
  }
}
