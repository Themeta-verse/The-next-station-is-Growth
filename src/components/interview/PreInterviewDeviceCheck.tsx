import React, { useEffect, useRef, useState } from 'react';
import { Camera, Mic, Volume2, CheckCircle2, AlertTriangle, RefreshCw, ArrowRight, VideoOff, MicOff, Settings } from 'lucide-react';
import { SpeechService } from '@/services/speechService';

interface PreInterviewDeviceCheckProps {
  onReady: (stream: MediaStream | null, videoDeviceId?: string, audioDeviceId?: string) => void;
  onBack: () => void;
  role: string;
  company: string;
}

export const PreInterviewDeviceCheck: React.FC<PreInterviewDeviceCheckProps> = ({
  onReady,
  onBack,
  role,
  company,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const activeStreamRef = useRef<MediaStream | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [cameraStatus, setCameraStatus] = useState<'checking' | 'granted' | 'denied' | 'unavailable'>('checking');
  const [micStatus, setMicStatus] = useState<'checking' | 'granted' | 'denied' | 'unavailable'>('checking');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [audioLevel, setAudioLevel] = useState(0); // 0 to 100
  const [availableVideoDevices, setAvailableVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [availableAudioDevices, setAvailableAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedVideoId, setSelectedVideoId] = useState<string>('');
  const [selectedAudioId, setSelectedAudioId] = useState<string>('');

  const [isTestSpeaking, setIsTestSpeaking] = useState(false);
  const [cameraToggledOff, setCameraToggledOff] = useState(false);
  const [micToggledOff, setMicToggledOff] = useState(false);

  // Initialize and request media streams
  const initializeDevices = async (videoId?: string, audioId?: string) => {
    setIsLoading(true);
    setErrorMessage(null);

    // Stop any existing tracks
    if (activeStreamRef.current) {
      activeStreamRef.current.getTracks().forEach((t) => t.stop());
      activeStreamRef.current = null;
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraStatus('unavailable');
        setMicStatus('unavailable');
        setErrorMessage('Your browser does not support camera and microphone access. Please update your browser or use Chrome/Firefox/Edge.');
        setIsLoading(false);
        return;
      }

      const constraints: MediaStreamConstraints = {
        video: videoId ? { deviceId: { exact: videoId } } : true,
        audio: audioId ? { deviceId: { exact: audioId } } : true,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      activeStreamRef.current = stream;

      // Camera granted
      setCameraStatus('granted');
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Mic granted & set up volume meter
      setMicStatus('granted');
      setupAudioMeter(stream);

      // Enumerate available devices for selection
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevs = devices.filter((d) => d.kind === 'videoinput');
      const audioDevs = devices.filter((d) => d.kind === 'audioinput');

      setAvailableVideoDevices(videoDevs);
      setAvailableAudioDevices(audioDevs);

      if (!videoId && videoDevs.length > 0) setSelectedVideoId(videoDevs[0].deviceId);
      if (!audioId && audioDevs.length > 0) setSelectedAudioId(audioDevs[0].deviceId);

      setIsLoading(false);
    } catch (err: any) {
      console.warn('Media devices setup error:', err);
      setIsLoading(false);

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraStatus('denied');
        setMicStatus('denied');
        setErrorMessage('Camera or Microphone permissions were blocked. Click the lock icon in your browser URL bar, allow Camera & Microphone, and click "Retry Check".');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraStatus('unavailable');
        setMicStatus('unavailable');
        setErrorMessage('No camera or microphone hardware was detected on this device. You can still test with keyboard fallback.');
      } else {
        setCameraStatus('denied');
        setMicStatus('denied');
        setErrorMessage(`Could not connect to audio/video devices: ${err.message || 'Unknown error'}`);
      }
    }
  };

  const setupAudioMeter = (stream: MediaStream) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateMeter = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        const normalized = Math.min(100, Math.round((avg / 128) * 100));
        setAudioLevel(normalized);
        animationFrameRef.current = requestAnimationFrame(updateMeter);
      };

      updateMeter();
    } catch (e) {
      console.warn('AudioContext volume meter setup error:', e);
    }
  };

  useEffect(() => {
    initializeDevices();

    return () => {
      if (activeStreamRef.current) {
        activeStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      SpeechService.stopSpeaking();
    };
  }, []);

  const handleDeviceChange = (type: 'video' | 'audio', deviceId: string) => {
    if (type === 'video') {
      setSelectedVideoId(deviceId);
      initializeDevices(deviceId, selectedAudioId);
    } else {
      setSelectedAudioId(deviceId);
      initializeDevices(selectedVideoId, deviceId);
    }
  };

  const handleTestAudio = () => {
    setIsTestSpeaking(true);
    SpeechService.speakText('This is a test of the Growth Station interviewer voice. Can you hear me clearly?', {
      onEnd: () => setIsTestSpeaking(false),
      onError: () => setIsTestSpeaking(false),
    });
  };

  const toggleCamera = () => {
    if (activeStreamRef.current) {
      const videoTrack = activeStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setCameraToggledOff(!videoTrack.enabled);
      }
    }
  };

  const toggleMic = () => {
    if (activeStreamRef.current) {
      const audioTrack = activeStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setMicToggledOff(!audioTrack.enabled);
      }
    }
  };

  const canProceed = cameraStatus === 'granted' || micStatus === 'granted' || cameraStatus === 'denied';

  const handleStart = () => {
    onReady(activeStreamRef.current, selectedVideoId, selectedAudioId);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary uppercase tracking-wider">
            Pre-Interview Device Check
          </span>
          <h2 className="text-2xl font-bold text-foreground mt-1">Camera & Microphone Setup</h2>
          <p className="text-sm text-muted-foreground">
            Preparing your realistic session for <strong className="text-foreground">{role}</strong>
            {company ? <span> at <strong className="text-foreground">{company}</strong></span> : ''}.
          </p>
        </div>
        <button
          onClick={onBack}
          className="px-3 py-1.5 text-sm rounded-lg border border-border text-muted-foreground hover:bg-muted/50 transition-colors self-start md:self-auto"
        >
          Change Role / Config
        </button>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-sm">
            <p className="font-semibold">Hardware Access Notice</p>
            <p className="text-xs text-destructive/80 mt-0.5">{errorMessage}</p>
          </div>
          <button
            onClick={() => initializeDevices(selectedVideoId, selectedAudioId)}
            className="px-3 py-1 text-xs font-medium rounded-md bg-destructive text-white hover:bg-destructive/90 transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry Check
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left: Camera Feed Preview */}
        <div className="md:col-span-7 flex flex-col gap-3">
          <div className="relative aspect-video rounded-2xl bg-zinc-950 overflow-hidden border border-border shadow-inner flex items-center justify-center">
            {cameraStatus === 'granted' && !cameraToggledOff ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover -scale-x-100"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-6 space-y-3">
                <VideoOff className="w-12 h-12 text-muted-foreground/60" />
                <p className="text-sm font-medium text-muted-foreground">
                  {cameraToggledOff ? 'Camera preview paused' : 'Camera video feed not active'}
                </p>
                <p className="text-xs text-muted-foreground/80 max-w-xs">
                  {cameraStatus === 'denied' 
                    ? 'Permissions blocked. You can still test with keyboard fallback, or unblock permissions in your browser.'
                    : 'A live camera mirror allows you to practice realistic eye contact and professional posture.'}
                </p>
              </div>
            )}

            {/* In-Preview Quick Toggles */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
              <div className="flex items-center gap-2 pointer-events-auto">
                <button
                  type="button"
                  onClick={toggleCamera}
                  disabled={cameraStatus !== 'granted'}
                  className={`p-2 rounded-lg backdrop-blur-md transition-all ${
                    cameraToggledOff 
                      ? 'bg-destructive/80 text-white' 
                      : 'bg-black/60 text-white hover:bg-black/80'
                  }`}
                  title={cameraToggledOff ? 'Turn camera on' : 'Turn camera off'}
                >
                  {cameraToggledOff ? <VideoOff className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={toggleMic}
                  disabled={micStatus !== 'granted'}
                  className={`p-2 rounded-lg backdrop-blur-md transition-all ${
                    micToggledOff 
                      ? 'bg-destructive/80 text-white' 
                      : 'bg-black/60 text-white hover:bg-black/80'
                  }`}
                  title={micToggledOff ? 'Unmute microphone' : 'Mute microphone'}
                >
                  {micToggledOff ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              </div>

              <div className="bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-xs text-white/90 font-mono flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${cameraStatus === 'granted' && !cameraToggledOff ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'}`} />
                {cameraStatus === 'granted' && !cameraToggledOff ? 'Live Preview' : 'Preview Off'}
              </div>
            </div>
          </div>

          {/* Real-time Microphone Audio Level Meter */}
          <div className="p-3.5 rounded-xl border border-border bg-card/60 space-y-2">
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="flex items-center gap-1.5 text-foreground">
                <Mic className="w-3.5 h-3.5 text-primary" /> Microphone Input Level
              </span>
              <span className="text-muted-foreground font-mono">
                {micStatus === 'granted' ? (micToggledOff ? 'Muted' : audioLevel > 5 ? 'Speaking...' : 'Listening') : 'Inactive'}
              </span>
            </div>
            <div className="w-full h-3 bg-muted rounded-full overflow-hidden p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-75 ${
                  audioLevel > 65
                    ? 'bg-amber-500'
                    : audioLevel > 15
                    ? 'bg-emerald-500'
                    : 'bg-primary/50'
                }`}
                style={{ width: `${micToggledOff ? 0 : audioLevel}%` }}
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              Speak a few words. The meter should bounce into green when speaking normally.
            </p>
          </div>
        </div>

        {/* Right: Device Selection & Diagnostics */}
        <div className="md:col-span-5 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Settings className="w-4 h-4" /> Device Settings
            </h3>

            {/* Video device selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground flex items-center justify-between">
                <span>Camera Device</span>
                {cameraStatus === 'granted' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
              </label>
              <select
                disabled={availableVideoDevices.length === 0}
                value={selectedVideoId}
                onChange={(e) => handleDeviceChange('video', e.target.value)}
                className="w-full text-xs rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
              >
                {availableVideoDevices.length > 0 ? (
                  availableVideoDevices.map((d, idx) => (
                    <option key={d.deviceId || idx} value={d.deviceId}>
                      {d.label || `Camera ${idx + 1}`}
                    </option>
                  ))
                ) : (
                  <option value="">Default Camera</option>
                )}
              </select>
            </div>

            {/* Audio device selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground flex items-center justify-between">
                <span>Microphone Device</span>
                {micStatus === 'granted' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
              </label>
              <select
                disabled={availableAudioDevices.length === 0}
                value={selectedAudioId}
                onChange={(e) => handleDeviceChange('audio', e.target.value)}
                className="w-full text-xs rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
              >
                {availableAudioDevices.length > 0 ? (
                  availableAudioDevices.map((d, idx) => (
                    <option key={d.deviceId || idx} value={d.deviceId}>
                      {d.label || `Microphone ${idx + 1}`}
                    </option>
                  ))
                ) : (
                  <option value="">Default Microphone</option>
                )}
              </select>
            </div>

            {/* Audio output test */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleTestAudio}
                disabled={isTestSpeaking}
                className="w-full py-2 px-3 text-xs font-medium rounded-lg border border-border bg-muted/30 hover:bg-muted/70 text-foreground transition-colors flex items-center justify-center gap-2"
              >
                <Volume2 className={`w-3.5 h-3.5 ${isTestSpeaking ? 'text-primary animate-pulse' : ''}`} />
                {isTestSpeaking ? 'Playing Sample Voice...' : 'Test Speaker Audio'}
              </button>
            </div>

            {/* Browser Feature Diagnostics */}
            <div className="p-3 rounded-xl border border-border bg-card/40 space-y-2 text-xs">
              <div className="font-semibold text-foreground">Browser Compatibility</div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Web Speech Recognition (STT):</span>
                <span className={SpeechService.isSTTSupported() ? 'text-emerald-500 font-medium' : 'text-amber-500 font-medium'}>
                  {SpeechService.isSTTSupported() ? 'Supported' : 'Fallback Mode'}
                </span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Speech Synthesis (TTS Voice):</span>
                <span className={SpeechService.isTTSSupported() ? 'text-emerald-500 font-medium' : 'text-amber-500 font-medium'}>
                  {SpeechService.isTTSSupported() ? 'Supported' : 'Text-Only'}
                </span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Camera & Mic Stream:</span>
                <span className={cameraStatus === 'granted' ? 'text-emerald-500 font-medium' : 'text-amber-500 font-medium'}>
                  {cameraStatus === 'granted' ? 'Active' : 'Unverified'}
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-4 border-t border-border flex flex-col gap-2">
            <button
              type="button"
              onClick={handleStart}
              disabled={isLoading || !canProceed}
              className="w-full py-3 px-4 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              Enter Interview Room <ArrowRight className="w-4 h-4" />
            </button>
            <p className="text-[11px] text-center text-muted-foreground">
              Raw audio & video streams are never stored on any server.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
