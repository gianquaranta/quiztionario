import { io, type Socket } from "socket.io-client"

// Socket.IO client configuration
const SOCKET_SERVER_URL = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || "http://localhost:3000"

class SocketManager {
  private socket: Socket | null = null
  private isConnected = false

  connect() {
    if (this.socket?.connected) return this.socket

    this.socket = io(SOCKET_SERVER_URL, {
      path: "/api/socket.io",
      transports: ["websocket", "polling"],
      autoConnect: true,
    })

    this.socket.on("connect", () => {
      console.log("✅ Socket connected:", this.socket?.id)
      this.isConnected = true
    })

    this.socket.on("disconnect", () => {
      console.log("❌ Socket disconnected")
      this.isConnected = false
    })

    this.socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error)
    })

    return this.socket
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.isConnected = false
    }
  }

  emit(event: string, ...args: any[]) {
    if (this.socket?.connected) {
      this.socket.emit(event, ...args)
    } else {
      console.warn(`Cannot emit ${event}: Socket not connected`)
    }
  }

  on(event: string, callback: (...args: any[]) => void) {
    if (this.socket) {
      this.socket.on(event, callback)
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
export const socket = socketManager.connect()
