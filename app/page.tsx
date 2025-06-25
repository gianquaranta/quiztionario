"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, BookOpen, Sparkles, Trophy, Zap } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-4 -left-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -top-4 -right-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="text-center mb-12 pt-8">
          <div className="flex justify-center items-center gap-3 mb-4">
            <Sparkles className="w-12 h-12 text-yellow-300 animate-pulse" />
            <h1 className="text-6xl font-bold text-white drop-shadow-lg">QuizMaster</h1>
            <Sparkles className="w-12 h-12 text-yellow-300 animate-pulse" />
          </div>
          <p className="text-2xl text-white/90 drop-shadow-md">🎯 The Ultimate Interactive Quiz Experience! 🎯</p>
          <div className="flex justify-center gap-4 mt-4">
            <div className="flex items-center gap-2 text-white/80">
              <Zap className="w-5 h-5" />
              <span>Lightning Fast</span>
            </div>
            <div className="flex items-center gap-2 text-white/80">
              <Trophy className="w-5 h-5" />
              <span>Competitive</span>
            </div>
            <div className="flex items-center gap-2 text-white/80">
              <Sparkles className="w-5 h-5" />
              <span>Super Fun</span>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
          <Card className="hover:shadow-2xl transition-all duration-300 transform hover:scale-105 bg-white/95 backdrop-blur-sm border-2 border-white/20">
            <CardHeader className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <BookOpen className="w-10 h-10 text-white" />
              </div>
              <CardTitle className="text-2xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                🎓 Teacher Portal
              </CardTitle>
              <CardDescription className="text-lg">Create epic quizzes and watch the magic happen!</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/teacher">
                <Button
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-3 text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                  size="lg"
                >
                  🚀 Launch Teacher Mode
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-2xl transition-all duration-300 transform hover:scale-105 bg-white/95 backdrop-blur-sm border-2 border-white/20">
            <CardHeader className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                <Users className="w-10 h-10 text-white" />
              </div>
              <CardTitle className="text-2xl bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                🎮 Student Portal
              </CardTitle>
              <CardDescription className="text-lg">Join the quiz battle and show your skills!</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/student">
                <Button
                  className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-bold py-3 text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                  size="lg"
                >
                  ⚡ Join the Fun!
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-12">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-6 py-3 text-white">
            <Sparkles className="w-5 h-5" />
            <span className="font-medium">Real-time • Competitive • Educational</span>
            <Sparkles className="w-5 h-5" />
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
