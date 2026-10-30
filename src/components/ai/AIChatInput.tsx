"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { Send, Square, Mic, Check, Loader2, Paperclip, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface AIChatInputProps {
  onSend: (text: string, imageFile: File | null) => Promise<void>;
  isGenerating: boolean;
  onStop: () => void;
  disabled?: boolean;
}

function formatRecordingDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const isMobileDevice = () => {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(max-width: 768px)").matches ||
    window.matchMedia("(pointer: coarse)").matches ||
    /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  );
};

export function AIChatInput({
  onSend,
  isGenerating,
  onStop,
  disabled = false,
}: AIChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [input, setInput] = useState("");
  const [isMultiLine, setIsMultiLine] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Image attachment states
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Voice recording states & refs
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isCancelledRef = useRef<boolean>(false);

  // Auto-resize textarea according to text length
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      const nextHeight = Math.min(Math.max(el.scrollHeight, 38), 160);
      el.style.height = `${nextHeight}px`;
      el.scrollTop = el.scrollHeight;
      setIsMultiLine(nextHeight > 42);
    } else {
      setIsMultiLine(false);
    }
  }, [input]);

  // Voice recording helpers
  const cleanupMediaRecording = useCallback(() => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    mediaRecorderRef.current = null;
    setRecordingDuration(0);
  }, []);

  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      isCancelledRef.current = true;
      mediaRecorderRef.current.stop();
    } else {
      cleanupMediaRecording();
      setIsRecording(false);
    }
  }, [cleanupMediaRecording]);

  const processVoiceRecording = async (blob: Blob) => {
    setIsTranscribing(true);
    try {
      const formData = new FormData();
      const ext = blob.type.includes("mp4") ? "mp4" : blob.type.includes("ogg") ? "ogg" : "webm";
      formData.append("audio", blob, `voice.${ext}`);

      const res = await fetch("/api/ai/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Не вдалося розпізнати аудіо");
      }

      const data = await res.json();
      const recognizedText = data.text?.trim();

      if (recognizedText) {
        setInput((prev) => {
          const separator = prev && !prev.endsWith(" ") ? " " : "";
          return `${prev}${separator}${recognizedText}`;
        });
        setTimeout(() => {
          textareaRef.current?.focus();
        }, 50);
      } else {
        toast.info("Голос не розпізнано. Спробуйте сказати чіткіше.");
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Помилка обробки голосу";
      toast.error(message);
    } finally {
      setIsTranscribing(false);
    }
  };

  const startRecording = async () => {
    if (isGenerating || isTranscribing || disabled) return;
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      toast.error("Ваш браузер не підтримує запис аудіо");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      audioChunksRef.current = [];
      isCancelledRef.current = false;

      let mimeType = "";
      if (typeof MediaRecorder !== "undefined") {
        const candidates = [
          "audio/webm;codecs=opus",
          "audio/webm",
          "audio/mp4",
          "audio/ogg;codecs=opus",
        ];
        for (const candidate of candidates) {
          if (MediaRecorder.isTypeSupported(candidate)) {
            mimeType = candidate;
            break;
          }
        }
      }

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const wasCancelled = isCancelledRef.current;
        const chunks = [...audioChunksRef.current];
        cleanupMediaRecording();
        setIsRecording(false);

        if (wasCancelled || chunks.length === 0) {
          return;
        }

        const audioBlob = new Blob(chunks, {
          type: recorder.mimeType || "audio/webm",
        });

        if (audioBlob.size < 100) {
          toast.info("Запис занадто короткий. Спробуйте ще раз.");
          return;
        }

        await processVoiceRecording(audioBlob);
      };

      recorder.start(250);
      setIsRecording(true);
      setRecordingDuration(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err: unknown) {
      cleanupMediaRecording();
      setIsRecording(false);
      const errorName = err instanceof Error ? err.name : "";
      if (errorName === "NotAllowedError" || errorName === "PermissionDeniedError") {
        toast.error("Доступ до мікрофона відхилено в налаштуваннях браузера");
      } else {
        toast.error("Не вдалося увімкнути мікрофон");
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      isCancelledRef.current = false;
      try {
        if (mediaRecorderRef.current.state === "recording") {
          mediaRecorderRef.current.requestData();
        }
      } catch {
        // Continue if requestData is not supported
      }
      mediaRecorderRef.current.stop();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupMediaRecording();
    };
  }, [cleanupMediaRecording]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Будь ласка, оберіть зображення");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Зображення занадто велике (максимум 10 МБ)");
      return;
    }

    setSelectedImage(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    e.target.value = "";
  };

  const handleRemoveImage = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedImage(null);
    setPreviewUrl(null);
  };

  const handleSubmit = async () => {
    const trimmed = input.trim();
    if ((!trimmed && !selectedImage) || isGenerating || isTranscribing || isSubmitting || disabled) {
      return;
    }

    setIsSubmitting(true);
    const textToSend = trimmed;
    const fileToSend = selectedImage;

    // Reset input fields
    setInput("");
    handleRemoveImage();

    try {
      await onSend(textToSend, fileToSend);
    } catch {
      // Error handled by parent toast
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter") {
      // Shift+Enter, Alt+Enter, Ctrl+Enter: newline
      if (e.shiftKey || e.altKey || e.ctrlKey) {
        return;
      }

      // On mobile devices, Enter inserts a new line (don't submit)
      if (isMobileDevice()) {
        return;
      }

      // On desktop, plain Enter submits
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <footer className="shrink-0 border-t border-border/80 p-3 bg-card/60 backdrop-blur-md">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        className="flex flex-col gap-2">
        {/* Image attachment preview */}
        {previewUrl && (
          <div className="relative inline-flex items-center gap-2 rounded-xl border border-border/60 bg-muted/40 p-1.5 pr-3 shadow-2xs animate-in fade-in duration-200 w-fit">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Прев'ю страви"
              className="h-11 w-11 rounded-lg object-cover border border-border/50 shrink-0"
            />
            <div className="flex flex-col text-xs pr-1">
              <span className="font-medium text-foreground truncate max-w-[130px] sm:max-w-[180px]">
                {selectedImage?.name || "Фото страви"}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {selectedImage
                  ? `${(selectedImage.size / 1024).toFixed(0)} KB`
                  : "Готово до відправки"}
              </span>
            </div>
            <button
              type="button"
              onClick={handleRemoveImage}
              className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
              title="Видалити фото">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {isRecording ? (
          <div className="flex w-full items-center justify-between rounded-xl border border-red-500/40 bg-red-500/10 py-1.5 pl-2.5 pr-1.5 text-xs shadow-xs min-h-[42px] animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={cancelRecording}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                title="Скасувати запис">
                <X className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-medium text-xs">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                </span>
                <span>Запис голосу...</span>
                <span className="font-mono text-xs opacity-80">
                  {formatRecordingDuration(recordingDuration)}
                </span>
              </div>
            </div>

            <Button
              type="button"
              size="icon"
              onClick={stopRecording}
              className="h-8 w-8 rounded-lg shadow-xs bg-red-600 text-white hover:bg-red-700 animate-pulse"
              title="Завершити та розпізнати">
              <Check className="h-4 w-4" />
            </Button>
          </div>
        ) : isTranscribing ? (
          <div className="flex w-full items-center gap-2.5 rounded-xl border border-primary/30 bg-primary/5 py-2 pl-3.5 pr-3 text-xs shadow-xs min-h-[42px] animate-in fade-in duration-200">
            <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
            <span className="text-xs text-muted-foreground font-medium">
              Розпізнаємо голос через Gemini...
            </span>
          </div>
        ) : (
          <div className="relative flex items-center w-full">
            {/* Hidden File Input (supports desktop picker and mobile camera/photos) */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Paperclip Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isGenerating || isTranscribing || isSubmitting || disabled}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors disabled:opacity-40 cursor-pointer"
              title="Прикріпити фото (файл або камера)">
              <Paperclip className="h-4 w-4" />
            </button>

            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleInputKeyDown}
              rows={1}
              disabled={disabled}
              placeholder={
                previewUrl
                  ? "Опишіть страву або надішліть..."
                  : "«З'їв на обід 200г гречки та 150г філе...»"
              }
              className="w-full resize-none rounded-xl border border-input bg-background/80 py-2.5 pl-10 pr-12 text-xs shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring placeholder:text-muted-foreground/70 max-h-40 overflow-y-auto leading-relaxed no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            />

            <div
              className={`absolute right-1.5 ${
                isMultiLine ? "bottom-1.5" : "top-1/2 -translate-y-1/2"
              }`}>
              {isGenerating ? (
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  onClick={onStop}
                  className="h-8 w-8 rounded-lg shadow-xs"
                  title="Зупинити генерацію">
                  <Square className="h-3 w-3 fill-current" />
                </Button>
              ) : input.trim().length > 0 || previewUrl ? (
                <Button
                  type="submit"
                  size="icon"
                  disabled={isSubmitting || disabled}
                  className="h-8 w-8 rounded-lg shadow-xs bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200"
                  title="Надіслати">
                  {isSubmitting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                </Button>
              ) : (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={startRecording}
                  disabled={disabled}
                  className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all duration-200"
                  title="Голосовий ввід">
                  <Mic className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        )}
      </form>
    </footer>
  );
}
