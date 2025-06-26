"use client"

import { useEffect, useState } from "react"
import { socketManager } from "@/lib/socket"

export function SocketDebug() {
  const [status, setStatus] = useState("Disconnected")
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    setLogs((prev) => [...prev.slice(-9), `${new Date().toLocaleTimeString()}: ${message}`])
  }

  useEffect(() => {
    const socket = socketManager.connect()

    socket.on("connect", () => {
      setStatus("Connected ✅")
      addLog("Socket connected successfully")
    })

    socket.on("disconnect", () => {
      setStatus("Disconnected ❌")
      addLog("Socket disconnected")
    })

    socket.on("connect_error", (error) => {
      setStatus("Error ❌")
      addLog(`Connection error: ${error.message}`)
    })

    return () => {
      socket.off("connect")
      socket.off("disconnect")
      socket.off("connect_error")
    }
  }, [])

  const testConnection = () => {
    addLog("Testing connection...")
    socketManager.emit("test", "Hello from client")
  }

  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <h3 className="font-bold mb-2">Socket.IO Debug</h3>
      <p className="mb-2">Status: {status}</p>
      <button onClick={testConnection} className="px-4 py-2 bg-blue-500 text-white rounded mb-2">
        Test Connection
      </button>
      <div className="text-sm">
        <h4 className="font-semibold">Logs:</h4>
        {logs.map((log, i) => (
          <div key={i} className="font-mono text-xs">
            {log}
          </div>
        ))}
      </div>
    </div>
  )
}
