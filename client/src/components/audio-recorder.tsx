import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Play, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface AudioRecorderProps {
  onAudioRecorded: (audioData: string) => void;
  existingAudio?: string;
  className?: string;
}

export function AudioRecorder({ onAudioRecorded, existingAudio, className }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(existingAudio || null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (existingAudio) {
      setAudioUrl(existingAudio);
    }
  }, [existingAudio]);

  useEffect(() => {
    // Initialize audio element
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.onended = () => setIsPlaying(false);
    }

    // Set audio source when URL changes
    if (audioRef.current && audioUrl) {
      audioRef.current.src = audioUrl;
    }

    // Cleanup
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        if (audioUrl && audioUrl.startsWith('blob:')) {
          URL.revokeObjectURL(audioUrl);
        }
      }
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        const newAudioUrl = URL.createObjectURL(audioBlob);
        setAudioUrl(newAudioUrl);
        
        // Convert to base64 for storage
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64data = reader.result as string;
          onAudioRecorded(base64data);
        };

        // Stop all tracks in the stream
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast({
        title: "Microphone Access Error",
        description: "Please make sure your microphone is connected and you've granted permission to use it.",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const playAudio = () => {
    if (audioRef.current && audioUrl) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const deleteAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    
    if (audioUrl && audioUrl.startsWith('blob:')) {
      URL.revokeObjectURL(audioUrl);
    }
    
    setAudioUrl(null);
    setAudioBlob(null);
    setIsPlaying(false);
    onAudioRecorded(''); // Clear the audio data
  };

  return (
    <div className={cn("rounded-md p-3 flex items-center justify-between bg-muted", className)}>
      <div className="flex items-center space-x-2">
        {!isRecording && !audioUrl && (
          <Button 
            onClick={startRecording} 
            size="sm" 
            variant="default"
            className="bg-primary"
          >
            <Mic className="h-4 w-4 mr-1" />
            Record
          </Button>
        )}
        
        {isRecording && (
          <div className="flex items-center space-x-2">
            <div className="animate-pulse">
              <div className="w-3 h-3 bg-destructive rounded-full"></div>
            </div>
            <span className="text-sm">Recording...</span>
            <Button onClick={stopRecording} size="sm" variant="destructive">
              <Square className="h-4 w-4" />
            </Button>
          </div>
        )}
        
        {audioUrl && !isRecording && (
          <div className="flex items-center space-x-2">
            {isPlaying ? (
              <Button onClick={pauseAudio} size="sm" variant="outline">
                <Square className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={playAudio} size="sm" variant="outline">
                <Play className="h-4 w-4" />
              </Button>
            )}
            <span className="text-sm">Voice note recorded</span>
          </div>
        )}
      </div>
      
      {audioUrl && !isRecording && (
        <Button onClick={deleteAudio} size="sm" variant="ghost" className="hover:bg-destructive/10">
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      )}
    </div>
  );
}
