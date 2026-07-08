"use client"

import { useState, useRef } from "react"
import { Mic, MicOff, Loader2 } from "lucide-react"

interface DictationButtonProps {
  onTranscription: (text: string) => void
  className?: string
}

export function DictationButton({ onTranscription, className = "" }: DictationButtonProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const mimeType = mediaRecorder.mimeType || 'audio/webm'
        const fileExtension = mimeType.includes('mp4') ? 'mp4' : mimeType.includes('mpeg') ? 'mpeg' : mimeType.includes('ogg') ? 'ogg' : 'webm'
        
        const audioBlob = new Blob(chunksRef.current, { type: mimeType })
        stream.getTracks().forEach(track => track.stop())
        await processAudio(audioBlob, fileExtension)
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error('Error al acceder al micrófono:', error)
      alert('No se pudo acceder al micrófono. Por favor revisa los permisos.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const processAudio = async (audioBlob: Blob, fileExtension: string) => {
    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', audioBlob, `audio.${fileExtension}`)

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Error en la transcripción')
      }

      const data = await response.json()
      if (data.text) {
        onTranscription(data.text)
      }
    } catch (error) {
      console.error('Error procesando audio:', error)
      alert('Hubo un error al transcribir el audio.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={isRecording ? stopRecording : startRecording}
      disabled={isLoading}
      className={`p-2 rounded-full transition-colors flex items-center justify-center shrink-0 ${
        isRecording 
          ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
          : 'bg-muted hover:bg-muted/80 text-foreground border border-border'
      } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      title={isRecording ? 'Detener grabación' : 'Dictar observación'}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isRecording ? (
        <MicOff className="w-4 h-4" />
      ) : (
        <Mic className="w-4 h-4" />
      )}
    </button>
  )
}
