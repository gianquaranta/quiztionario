import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types
export interface Teacher {
  id: string
  email: string
  name: string
  password_hash: string
  created_at: string
}

export interface Quiz {
  id: string
  teacher_id: string
  title: string
  description: string
  created_at: string
  questions?: Question[]
}

export interface Question {
  id: string
  quiz_id: string
  question_text: string
  max_points: number
  order_index: number
  created_at: string
}

export interface QuizSession {
  id: string
  quiz_id: string
  teacher_id: string
  session_code: string
  status: "waiting" | "active" | "ended"
  current_question_id?: string
  current_question_started_at?: string
  created_at: string
  quiz?: Quiz
  participants?: SessionParticipant[]
}

export interface SessionParticipant {
  id: string
  session_id: string
  student_name: string
  total_points: number
  is_connected: boolean
  joined_at: string
}

export interface StudentResponse {
  id: string
  session_id: string
  participant_id: string
  question_id: string
  response_time: number
  points_awarded: number
  rank_position?: number
  responded_at: string
}

// Database functions
export const db = {
  // Teacher functions
  async createTeacher(email: string, name: string, passwordHash: string) {
    const { data, error } = await supabase
      .from("teachers")
      .insert({ email, name, password_hash: passwordHash })
      .select()
      .single()

    if (error) throw error
    return data as Teacher
  },

  async getTeacherByEmail(email: string) {
    const { data, error } = await supabase.from("teachers").select("*").eq("email", email).single()

    if (error && error.code !== "PGRST116") throw error
    return data as Teacher | null
  },

  // Quiz functions
  async createQuiz(teacherId: string, title: string, description: string) {
    const { data, error } = await supabase
      .from("quizzes")
      .insert({ teacher_id: teacherId, title, description })
      .select()
      .single()

    if (error) throw error
    return data as Quiz
  },

  async getTeacherQuizzes(teacherId: string) {
    const { data, error } = await supabase
      .from("quizzes")
      .select(`
        *,
        questions (*)
      `)
      .eq("teacher_id", teacherId)
      .order("created_at", { ascending: false })

    if (error) throw error
    return data as Quiz[]
  },

  async addQuestionToQuiz(quizId: string, questionText: string, maxPoints: number, orderIndex: number) {
    const { data, error } = await supabase
      .from("questions")
      .insert({
        quiz_id: quizId,
        question_text: questionText,
        max_points: maxPoints,
        order_index: orderIndex,
      })
      .select()
      .single()

    if (error) throw error
    return data as Question
  },

  // Session functions
  async createQuizSession(teacherId: string, quizId: string) {
    // Generate unique session code
    let sessionCode: string
    let attempts = 0

    do {
      const { data: codeData } = await supabase.rpc("generate_session_code")
      sessionCode = codeData
      attempts++
    } while (attempts < 10) // Prevent infinite loop

    const { data, error } = await supabase
      .from("quiz_sessions")
      .insert({
        teacher_id: teacherId,
        quiz_id: quizId,
        session_code: sessionCode,
        status: "waiting",
      })
      .select(`
        *,
        quiz:quizzes (
          *,
          questions (*)
        )
      `)
      .single()

    if (error) throw error
    return data as QuizSession
  },

  async getSessionByCode(sessionCode: string) {
    const { data, error } = await supabase
      .from("quiz_sessions")
      .select(`
        *,
        quiz:quizzes (
          *,
          questions (*)
        )
      `)
      .eq("session_code", sessionCode)
      .eq("status", "waiting")
      .single()

    if (error && error.code !== "PGRST116") throw error
    return data as QuizSession | null
  },

  async joinSession(sessionId: string, studentName: string) {
    const { data, error } = await supabase
      .from("session_participants")
      .insert({
        session_id: sessionId,
        student_name: studentName,
      })
      .select()
      .single()

    if (error) throw error
    return data as SessionParticipant
  },

  async getSessionParticipants(sessionId: string) {
    const { data, error } = await supabase
      .from("session_participants")
      .select("*")
      .eq("session_id", sessionId)
      .order("total_points", { ascending: false })

    if (error) throw error
    return data as SessionParticipant[]
  },

  async startQuestion(sessionId: string, questionId: string) {
    const { data, error } = await supabase
      .from("quiz_sessions")
      .update({
        current_question_id: questionId,
        current_question_started_at: new Date().toISOString(),
        status: "active",
      })
      .eq("id", sessionId)
      .select()
      .single()

    if (error) throw error
    return data as QuizSession
  },

  async recordStudentResponse(sessionId: string, participantId: string, questionId: string, responseTime: number) {
    try {
      const { data, error } = await supabase
        .from("student_responses")
        .insert({
          session_id: sessionId,
          participant_id: participantId,
          question_id: questionId,
          response_time: responseTime,
        })
        .select()
        .single()

      if (error) {
        console.error("Error al insertar respuesta:", error)
        throw error
      }
      return data as StudentResponse
    } catch (error) {
      console.error("Error en recordStudentResponse:", error)
      throw error
    }
  },

  async awardPoints(responseId: string, points: number, rankPosition: number) {
    try {
      const { data, error } = await supabase
        .from("student_responses")
        .update({
          points_awarded: points,
          rank_position: rankPosition,
        })
        .eq("id", responseId)
        .select()
        .single()

      if (error) {
        console.error("Error al actualizar puntos:", error)
        throw error
      }

      // Update participant total points using the stored function
      const response = data as StudentResponse
      const { error: updateError } = await supabase.rpc("update_participant_points", {
        p_participant_id: response.participant_id,
      })

      if (updateError) {
        console.error("Error al actualizar puntos totales:", updateError)
        throw updateError
      }

      return response
    } catch (error) {
      console.error("Error en awardPoints:", error)
      throw error
    }
  },

  async endSession(sessionId: string) {
    const { data, error } = await supabase
      .from("quiz_sessions")
      .update({ status: "ended" })
      .eq("id", sessionId)
      .select()
      .single()

    if (error) throw error
    return data as QuizSession
  },
}
