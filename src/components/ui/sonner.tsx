"use client"

import * as React from "react"

type ToastType = "success" | "error" | "default"

interface Toast {
  id: string
  title: string
  type: ToastType
}

let toastCallback: ((t: Toast) => void) | null = null

export function toast(title: string, options?: { type?: ToastType }) {
  const toast: Toast = {
    id: Math.random().toString(36).slice(2),
    title,
    type: options?.type || "default",
  }
  if (toastCallback) {
    toastCallback(toast)
  }
}

function ToasterComponent() {
  const [toasts, setToasts] = React.useState<Toast[]>([])

  React.useEffect(() => {
    toastCallback = (t: Toast) => {
      setToasts((prev) => [...prev, t])
      setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== t.id))
      }, 3000)
    }
    return () => {
      toastCallback = null
    }
  }, [])

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`rounded-lg px-4 py-3 shadow-lg ${
            t.type === "success"
              ? "bg-green-600 text-white"
              : t.type === "error"
              ? "bg-red-600 text-white"
              : "bg-gray-900 text-white"
          }`}
        >
          {t.title}
        </div>
      ))}
    </div>
  )
}

export const Toaster = ToasterComponent