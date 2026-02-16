import { useState, useEffect, useCallback } from 'react'

interface UseNotificationsResult {
  permission: NotificationPermission | 'unsupported'
  requestPermission: () => Promise<boolean>
  scheduleNotification: (title: string, body: string, atTime: Date) => number
  cancelNotification: (id: number) => void
  cancelAll: () => void
}

const timers = new Map<number, ReturnType<typeof setTimeout>>()
let nextId = 1

export function useNotifications(): UseNotificationsResult {
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>(() => {
    if (typeof Notification === 'undefined') return 'unsupported'
    return Notification.permission
  })

  useEffect(() => {
    if (typeof Notification !== 'undefined') {
      setPermission(Notification.permission)
    }
  }, [])

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (typeof Notification === 'undefined') return false
    const result = await Notification.requestPermission()
    setPermission(result)
    return result === 'granted'
  }, [])

  const scheduleNotification = useCallback(
    (title: string, body: string, atTime: Date): number => {
      const id = nextId++
      const delay = atTime.getTime() - Date.now()

      if (delay <= 0) {
        fireNotification(title, body)
        return id
      }

      const timer = setTimeout(() => {
        fireNotification(title, body)
        timers.delete(id)
      }, delay)

      timers.set(id, timer)
      return id
    },
    [],
  )

  const cancelNotification = useCallback((id: number) => {
    const timer = timers.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.delete(id)
    }
  }, [])

  const cancelAll = useCallback(() => {
    timers.forEach((timer) => clearTimeout(timer))
    timers.clear()
  }, [])

  return {
    permission,
    requestPermission,
    scheduleNotification,
    cancelNotification,
    cancelAll,
  }
}

function fireNotification(title: string, body: string) {
  if (typeof Notification === 'undefined') return
  if (Notification.permission !== 'granted') return

  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.ready.then((reg) => {
      reg.showNotification(title, {
        body,
        icon: '/sleep_tracker/icons/icon-192.png',
        badge: '/sleep_tracker/icons/icon-192.png',
        tag: 'sleep-tracker',
      } as NotificationOptions)
    })
  } else {
    new Notification(title, { body })
  }
}
