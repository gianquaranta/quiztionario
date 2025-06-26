import { io, type Socket } from "socket.io-client"

const SOCKET_SERVER_URL = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || "http://localhost:3001"

class SocketManager {
  private socket: Socket | null = null
  private isConnected = false
  private reconnectAttempts = 0
  private maxReconnectAttempts = 10

  connect() {
    if (this.socket?.connected) {
      console.log("✅ Socket already connected")
      return this.socket
    }

    console.log("🔌 Connecting to Socket.IO server:", SOCKET_SERVER_URL)

    this.socket = io(SOCKET_SERVER_URL, {
      transports: ["websocket", "polling"],
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      path: '/socket.io/',
      forceNew: false,
      upgrade: true,
      rememberUpgrade: true
    })

    this.socket.on("connect", () => {
      console.log("✅ Socket connected successfully:", this.socket?.id)
      console.log("Transport used:", this.socket?.io.engine.transport.name)
      this.isConnected = true
      this.reconnectAttempts = 0
    })

    this.socket.on("disconnect", (reason) => {
      console.log("❌ Socket disconnected:", reason)
      this.isConnected = false
    })

    this.socket.on("connect_error", (error) => {
      console.error("❌ Socket connection error:", error.message)
      console.error("Error details:", error)
      this.reconnectAttempts++

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error("❌ Max reconnection attempts reached")
        console.log("💡 Try refreshing the page or check server status")
      }
    })

    this.socket.on("reconnect", (attemptNumber) => {
      console.log(`✅ Socket reconnected after ${attemptNumber} attempts`)
      this.isConnected = true
    })

    this.socket.on("reconnect_error", (error) => {
      console.error("❌ Socket reconnection error:", error.message)
    })

    return this.socket
  }

  disconnect() {
    if (this.socket) {
      console.log("🔌 Disconnecting socket...")
      this.socket.disconnect()
      this.socket = null
      this.isConnected = false
    }
  }

  emit(event: string, ...args: any[]) {
    if (this.socket?.connected) {
      console.log(`📤 Emitting: ${event}`)
      this.socket.emit(event, ...args)
    } else {
      console.warn(`⚠️ Cannot emit ${event}: Socket not connected`)
    }
  }

  on(event: string, callback: (...args: any[]) => void) {
    if (this.socket) {
      this.socket.on(event, (...args) => {
        console.log(`📥 Received: ${event}`)
        callback(...args)
      })
    }
  }

  off(event: string, callback?: (...args: any[]) => void) {
    if (this.socket) {
      this.socket.off(event, callback)
    }
  }

  get connected() {
    return this.isConnected && this.socket?.connected
  }
}

// Export singleton instance
export const socketManager = new SocketManager()
