import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GraduationCap, Users, Zap, Trophy, Star, BookOpen } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 md:w-64 md:h-64 bg-purple-100 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute top-3/4 right-1/4 w-32 h-32 md:w-64 md:h-64 bg-yellow-100 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-32 h-32 md:w-64 md:h-64 bg-pink-100 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 md:py-16">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <BookOpen className="w-8 h-8 md:w-10 md:h-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-800 mb-4 md:mb-6">
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Quiztionario
            </span>
          </h1>
          <p className="text-lg md:text-xl lg:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed px-4">
            La plataforma de quiz interactiva que transforma el aprendizaje en una experiencia emocionante y competitiva
          </p>
        </div>

        {/* Main action card for students */}
        <div className="max-w-md mx-auto mb-12 md:mb-16">
          <Card className="group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Users className="w-8 h-8 md:w-10 md:h-10 text-white" />
              </div>
              <CardTitle className="text-xl md:text-2xl text-gray-800">🎮 Soy Estudiante</CardTitle>
              <CardDescription className="text-base md:text-lg text-gray-600">
                Unite a un quiz y competí con tus compañeros
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-center gap-2 text-sm md:text-base text-gray-600">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span>Respuestas rápidas</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm md:text-base text-gray-600">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  <span>Tabla de posiciones</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm md:text-base text-gray-600">
                  <Zap className="w-4 h-4 text-green-500" />
                  <span>Competencia en vivo</span>
                </div>
              </div>
              <Link href="/student">
                <Button className="w-full h-12 md:h-14 text-base md:text-lg font-bold bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-300">
                  🎯 Unirme a un Quiz
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Discrete teacher access */}
        <div className="text-center mb-8">
          <p className="text-sm text-gray-500 mb-3">
            ¿Sos docente?{" "}
            <Link 
              href="/teacher" 
              className="text-gray-600 hover:text-indigo-600 underline underline-offset-2 transition-colors duration-200 text-sm"
            >
              Accedé al panel de profesor
            </Link>
          </p>
        </div>

        {/* Features section */}
        <div className="text-center max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6 md:mb-8">¿Por qué elegir Quiztionario?</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 md:p-6 shadow-lg">
              <div className="text-3xl md:text-4xl mb-3">⚡</div>
              <h3 className="font-bold text-base md:text-lg text-gray-800 mb-2">Tiempo Real</h3>
              <p className="text-sm md:text-base text-gray-600">
                Interacción instantánea entre profesores y estudiantes
              </p>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 md:p-6 shadow-lg">
              <div className="text-3xl md:text-4xl mb-3">🎯</div>
              <h3 className="font-bold text-base md:text-lg text-gray-800 mb-2">Fácil de Usar</h3>
              <p className="text-sm md:text-base text-gray-600">Interfaz intuitiva diseñada para todos los niveles</p>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 md:p-6 shadow-lg sm:col-span-2 lg:col-span-1">
              <div className="text-3xl md:text-4xl mb-3">🏆</div>
              <h3 className="font-bold text-base md:text-lg text-gray-800 mb-2">Competitivo</h3>
              <p className="text-sm md:text-base text-gray-600">
                Sistema de puntos y rankings para motivar el aprendizaje
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
