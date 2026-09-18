import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Radio,
  Volume2,
  VolumeX,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  BookOpen,
  HelpCircle,
  Play,
  Square,
} from 'lucide-react';

interface LiveVoiceTutorProps {
  currentBookTitle?: string;
  currentChapterTitle?: string;
}

export const LiveVoiceTutor: React.FC<LiveVoiceTutorProps> = ({
  currentBookTitle = 'Class 10 Literature & Science',
  currentChapterTitle = 'Curriculum Core',
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [transcripts, setTranscripts] = useState<Array<{ role: 'user' | 'tutor'; text: string }>>([
    {
      role: 'tutor',
      text: `Hello! I am your real-time Voice Study Tutor powered by Gemini 3.1 Flash Live. Tap "Start Voice Session" and talk to me naturally about any chapter, concept, or exam question!`,
    },
  ]);
  const [audioLevel, setAudioLevel] = useState(0);

  // Audio Context and Stream References
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const nextPlayTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const isMutedRef = useRef(false);

  isMutedRef.current = isMuted;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  const connect = async () => {
    try {
      setIsConnecting(true);
      setErrorMessage(null);

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      mediaStreamRef.current = stream;

      // Establish WebSocket connection
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/live`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setIsConnecting(false);
        setupAudioRecording(stream);
        setupAudioPlayback();
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.error) {
            setErrorMessage(data.error);
          }
          if (data.interrupted) {
            // User interrupted model; cancel active audio output
            stopAllAudioOutput();
          }
          if (data.audio) {
            playRawPCM24k(data.audio);
          }
          if (data.text) {
            setTranscripts((prev) => {
              const last = prev[prev.length - 1];
              if (last && last.role === 'tutor') {
                return [...prev.slice(0, -1), { role: 'tutor', text: last.text + ' ' + data.text }];
              } else {
                return [...prev, { role: 'tutor', text: data.text }];
              }
            });
          }
        } catch (e) {
          console.error('Error parsing live WS message:', e);
        }
      };

      ws.onerror = (err) => {
        console.error('Live WS error:', err);
        setErrorMessage('WebSocket connection error. Please ensure the server is running.');
        setIsConnecting(false);
      };

      ws.onclose = () => {
        setIsConnected(false);
        setIsConnecting(false);
        stopAudioStreams();
      };
    } catch (err: any) {
      console.error('Failed to start Live Voice session:', err);
      setErrorMessage(
        err.name === 'NotAllowedError'
          ? 'Microphone permission denied. Please allow microphone access in browser settings.'
          : err.message || 'Failed to connect to Live API.'
      );
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    stopAudioStreams();
    setIsConnected(false);
    setIsConnecting(false);
  };

  const stopAudioStreams = () => {
    if (scriptProcessorRef.current) {
      try {
        scriptProcessorRef.current.disconnect();
      } catch {}
      scriptProcessorRef.current = null;
    }
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch {}
      audioContextRef.current = null;
    }
    stopAllAudioOutput();
    if (outputAudioContextRef.current) {
      try {
        outputAudioContextRef.current.close();
      } catch {}
      outputAudioContextRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  };

  const stopAllAudioOutput = () => {
    activeSourcesRef.current.forEach((src) => {
      try {
        src.stop();
        src.disconnect();
      } catch {}
    });
    activeSourcesRef.current = [];
    if (outputAudioContextRef.current) {
      nextPlayTimeRef.current = outputAudioContextRef.current.currentTime;
    }
  };

  const setupAudioPlayback = () => {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContextClass({ sampleRate: 24000 });
    outputAudioContextRef.current = ctx;
    nextPlayTimeRef.current = ctx.currentTime;
  };

  const setupAudioRecording = (stream: MediaStream) => {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContextClass({ sampleRate: 16000 });
    audioContextRef.current = ctx;

    const source = ctx.createMediaStreamSource(stream);
    // Buffer size 2048 at 16000Hz sends chunks every ~128ms
    const processor = ctx.createScriptProcessor(2048, 1, 1);
    scriptProcessorRef.current = processor;

    processor.onaudioprocess = (e) => {
      if (isMutedRef.current || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        return;
      }

      const inputData = e.inputBuffer.getChannelData(0);

      // Compute RMS audio level for animation
      let sum = 0;
      for (let i = 0; i < inputData.length; i++) {
        sum += inputData[i] * inputData[i];
      }
      const rms = Math.sqrt(sum / inputData.length);
      setAudioLevel(Math.min(100, Math.round(rms * 400)));

      // Convert Float32Array to 16-bit PCM
      const pcm16 = new Int16Array(inputData.length);
      for (let i = 0; i < inputData.length; i++) {
        const s = Math.max(-1, Math.min(1, inputData[i]));
        pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
      }

      // Convert to base64
      const uint8 = new Uint8Array(pcm16.buffer);
      let binary = '';
      const len = uint8.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(uint8[i]);
      }
      const base64Audio = btoa(binary);

      wsRef.current.send(JSON.stringify({ audio: base64Audio }));
    };

    source.connect(processor);
    processor.connect(ctx.destination);
  };

  const playRawPCM24k = (base64Audio: string) => {
    const ctx = outputAudioContextRef.current;
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    // Decode base64 to Int16Array
    const binary = atob(base64Audio);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const int16 = new Int16Array(bytes.buffer);

    // Convert to Float32Array (-1 to 1)
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) {
      float32[i] = int16[i] / 32768.0;
    }

    // Create audio buffer at 24000Hz (Live API output rate)
    const audioBuffer = ctx.createBuffer(1, float32.length, 24000);
    audioBuffer.getChannelData(0).set(float32);

    const sourceNode = ctx.createBufferSource();
    sourceNode.buffer = audioBuffer;
    sourceNode.connect(ctx.destination);

    const now = ctx.currentTime;
    const startTime = Math.max(now, nextPlayTimeRef.current);
    sourceNode.start(startTime);
    nextPlayTimeRef.current = startTime + audioBuffer.duration;

    activeSourcesRef.current.push(sourceNode);
    sourceNode.onended = () => {
      activeSourcesRef.current = activeSourcesRef.current.filter((s) => s !== sourceNode);
    };
  };

  const sendQuickText = (text: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ text }));
      setTranscripts((prev) => [...prev, { role: 'user', text }]);
    }
  };

  return (
    <div id="live-voice-tutor-container" className="p-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-emerald-900 to-cyan-950 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden mb-8 border border-teal-800/40">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold border border-teal-500/30">
                <Radio className="w-3.5 h-3.5 animate-pulse text-teal-400" />
                Gemini 3.1 Flash Live Preview
              </span>
              <span className="text-xs text-teal-300/80">Bidirectional Voice Stream</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-serif tracking-tight">
              Real-Time Voice Study Tutor
            </h1>
            <p className="text-teal-200/90 text-sm mt-1 max-w-xl leading-relaxed">
              Have natural, spoken tutoring conversations. Ask spoken questions about{' '}
              <span className="font-semibold text-white">{currentChapterTitle}</span> or any concept,
              interrupt naturally, and get immediate spoken guidance.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            {!isConnected ? (
              <button
                id="start-voice-session-btn"
                onClick={connect}
                disabled={isConnecting}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold shadow-lg shadow-teal-500/30 transition-all active:scale-95 disabled:opacity-50"
              >
                {isConnecting ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Connecting to Live API...
                  </>
                ) : (
                  <>
                    <Mic className="w-5 h-5" />
                    Start Voice Session
                  </>
                )}
              </button>
            ) : (
              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  id="toggle-mic-mute-btn"
                  onClick={() => setIsMuted(!isMuted)}
                  className={`p-3.5 rounded-xl font-medium transition-all ${
                    isMuted
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                      : 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
                  }`}
                  title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
                >
                  {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5 text-teal-300" />}
                </button>
                <button
                  id="stop-voice-session-btn"
                  onClick={disconnect}
                  className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-rose-600/90 hover:bg-rose-500 text-white font-semibold transition-all shadow-lg active:scale-95"
                >
                  <Square className="w-4 h-4 fill-current" />
                  End Session
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Live Status Indicator */}
        <div className="mt-6 pt-4 border-t border-teal-800/60 flex items-center justify-between text-xs text-teal-300/80">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isConnected
                  ? 'bg-emerald-400 ring-4 ring-emerald-400/20 animate-pulse'
                  : 'bg-slate-500'
              }`}
            />
            <span>{isConnected ? 'Live Audio Channel Active' : 'Offline / Ready to Connect'}</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Model: gemini-3.1-flash-live-preview</span>
            <span>PCM 16kHz In / 24kHz Out</span>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold">Live Connection Notice</p>
            <p className="text-rose-700 mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Active Voice Radar & Waveform when connected */}
      {isConnected && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 mb-8 text-center relative overflow-hidden">
          <div className="flex flex-col items-center justify-center">
            {/* Pulsing Visualizer Halo */}
            <div className="relative mb-6">
              <div
                className="w-24 h-24 rounded-full bg-teal-500/20 flex items-center justify-center transition-transform duration-75"
                style={{ transform: `scale(${1 + audioLevel / 120})` }}
              >
                <div
                  className="w-16 h-16 rounded-full bg-teal-500/40 flex items-center justify-center transition-transform duration-75"
                  style={{ transform: `scale(${1 + audioLevel / 180})` }}
                >
                  <div className="w-10 h-10 rounded-full bg-teal-400 flex items-center justify-center text-slate-950 shadow-lg shadow-teal-400/50">
                    <Mic className="w-5 h-5" />
                  </div>
                </div>
              </div>
              <div
                className="absolute inset-0 rounded-full border-2 border-teal-400/30 animate-ping pointer-events-none"
                style={{ animationDuration: '2s' }}
              />
            </div>

            <h3 className="text-lg font-semibold text-white">
              {isMuted ? 'Microphone is Muted' : 'Tutor is Listening to You...'}
            </h3>
            <p className="text-slate-400 text-xs max-w-md mt-1">
              Speak normally. You can ask: &quot;Can you explain why Lencho got angry at the post office
              clerks?&quot; or &quot;How does ATP work in cell respiration?&quot;
            </p>

            {/* Simulated Live Equalizer Bars */}
            <div className="flex items-center gap-1.5 mt-6 h-8">
              {[12, 24, 40, 65, 30, 80, 50, 20, 45, 70, 35, 15].map((height, i) => (
                <div
                  key={i}
                  className="w-1.5 bg-teal-400/80 rounded-full transition-all duration-75"
                  style={{
                    height: `${Math.max(6, Math.min(32, (height * (audioLevel + 20)) / 100))}px`,
                    opacity: isMuted ? 0.3 : 0.9,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Suggested Voice Prompts */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 mb-8">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-teal-600" />
          Suggested Discussion Topics for Spoken Tutoring
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            {
              topic: 'Lencho’s Faith vs Irony',
              prompt: 'Why is the ending of A Letter to God called situational irony?',
            },
            {
              topic: 'Nelson Mandela’s Twins of Freedom',
              prompt: 'Explain what Mandela meant by the twin obligations of every man.',
            },
            {
              topic: 'Photosynthesis vs Respiration',
              prompt: 'How is ATP generated in mitochondria during cellular respiration?',
            },
            {
              topic: 'Snell’s Law of Refraction',
              prompt: 'Why does light bend when moving from water into air?',
            },
            {
              topic: 'Silk Routes & Biological Impact',
              prompt: 'How did smallpox help Spanish conquest of the Americas?',
            },
            {
              topic: 'GDP & Tertiary Sector',
              prompt: 'Why has the service sector grown so rapidly in modern economies?',
            },
          ].map((item, idx) => (
            <button
              key={idx}
              onClick={() => sendQuickText(item.prompt)}
              className="text-left p-3.5 rounded-xl bg-white border border-slate-200/70 hover:border-teal-400 hover:shadow-md transition-all text-xs group"
            >
              <span className="font-semibold text-slate-900 block group-hover:text-teal-700">
                {item.topic}
              </span>
              <span className="text-slate-500 mt-1 block leading-relaxed line-clamp-2">
                &quot;{item.prompt}&quot;
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Spoken Dialogue History Transcript */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-teal-600" />
            Live Dialogue Transcript
          </h2>
          <span className="text-xs text-slate-400">
            {transcripts.length} message{transcripts.length === 1 ? '' : 's'}
          </span>
        </div>

        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
          {transcripts.map((msg, index) => (
            <div
              key={index}
              className={`flex gap-3 text-sm ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.role === 'tutor' && (
                <div className="w-8 h-8 rounded-full bg-teal-100 border border-teal-200 text-teal-800 flex items-center justify-center shrink-0 text-xs font-bold font-serif">
                  AI
                </div>
              )}
              <div
                className={`p-4 rounded-2xl max-w-xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-teal-600 text-white rounded-br-none'
                    : 'bg-slate-50 text-slate-800 border border-slate-200/80 rounded-bl-none'
                }`}
              >
                <p>{msg.text}</p>
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center shrink-0 text-xs font-bold">
                  You
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
