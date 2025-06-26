"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Sparkles, Trophy, Zap, Settings } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 relative overflow-hidden">
      {/* Elementos de fondo más sutiles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-4 -left-4 w-72 h-72 bg-blue-100 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute -top-4 -right-4 w-72 h-72 bg-indigo-100 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-slate-100 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      <div className="container mx-auto p-8 relative z-10">
        {/* Acceso discreto para profesores */}
        <div className="absolute top-4 right-4">
          <Link href="/teacher">
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-500 hover:text-slate-700 hover:bg-slate-100/50 text-xs"
            >
              <Settings className="w-3 h-3 mr-1" />
              Acceso Docente
            </Button>
          </Link>
        </div>

        <div className="text-center mb-12 pt-8">
          <div className="flex justify-center items-center gap-3 mb-4">
            <Sparkles className="w-10 h-10 text-blue-500 animate-pulse" />
            <h1 className="text-5xl font-bold text-slate-800 drop-shadow-sm">QuizMaster</h1>
            <Sparkles className="w-10 h-10 text-blue-500 animate-pulse" />
          </div>
          <p className="text-xl text-slate-600 drop-shadow-sm">🎯 La experiencia de quiz interactiva definitiva</p>
          <div className="flex justify-center gap-6 mt-6">
            <div className="flex items-center gap-2 text-slate-500">
              <Zap className="w-4 h-4" />
              <span>Súper Rápido</span>
            </div>
            <div className="flex items-center gap-2 text-slate-500">
              <Trophy className="w-4 h-4" />
              <span>Competitivo</span>
            </div>
            <div className="flex items-center gap-2 text-slate-500">
              <Sparkles className="w-4 h-4" />
              <span>Divertido</span>
            </div>
          </div>
        </div>

        {/* Solo el botón de estudiantes prominente */}
        <div className="flex justify-center">
          <Card className="w-full max-w-md hover:shadow-xl transition-all duration-300 transform hover:scale-105 bg-white/90 backdrop-blur-sm border border-slate-200 shadow-lg">
            <CardHeader className="text-center">
              <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                <Users className="w-12 h-12 text-white" />
              </div>
              <CardTitle className="text-2xl bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                🎮 Portal de Estudiantes
              </CardTitle>
              <CardDescription className="text-lg text-slate-600">
                ¡Únete a la batalla de conocimiento y demuestra tus habilidades!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/student">
                <Button
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold py-4 text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                  size="lg"
                >
                  ⚡ ¡Unirse al Quiz!
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-12">
          <div className="inline-flex items-center gap-2 bg-white/40 backdrop-blur-sm rounded-full px-6 py-3 text-slate-600 border border-slate-200">
            <Sparkles className="w-4 h-4" />
            <span className="font-medium">Tiempo Real • Competitivo • Educativo</span>
            <Sparkles className="w-4 h-4" />
          </div>
        </div>

        {/* Información adicional más discreta */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-semibold text-slate-700 mb-6">¿Cómo funciona?</h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-white/60 backdrop-blur-sm rounded-lg p-6 border border-slate-200">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">1️⃣</span>
              </div>
              <h3 className="font-semibold text-slate-700 mb-2">Ingresa el Código</h3>
              <p className="text-slate-600 text-sm">Tu profesor te dará un código de 6 dígitos para unirte al quiz</p>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-lg p-6 border border-slate-200">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">2️⃣</span>
              </div>
              <h3 className="font-semibold text-slate-700 mb-2">Responde Rápido</h3>
              <p className="text-slate-600 text-sm">
                Presiona el botón lo más rápido posible cuando aparezca la pregunta
              </p>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-lg p-6 border border-slate-200">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">3️⃣</span>
              </div>
              <h3 className="font-semibold text-slate-700 mb-2">Gana Puntos</h3>
              <p className="text-slate-600 text-sm">Los más rápidos obtienen más puntos y suben en el ranking</p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  )
}
