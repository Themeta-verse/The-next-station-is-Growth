import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import MockInterview from '@/pages/dashboard/MockInterview';
import { PreInterviewDeviceCheck } from '@/components/interview/PreInterviewDeviceCheck';
import { InterviewReportView } from '@/components/interview/InterviewReportView';
import { InterviewEngine, InterviewConfig, InterviewReport } from '@/services/interviewEngine';
import { SpeechService } from '@/services/speechService';
import { useStationStore } from '@/store/useStationStore';
import { usePerformanceStore } from '@/store/usePerformanceStore';

// Mock AuthContext
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test_user_1', email: 'student@example.com' },
    profile: { name: 'Aryan Sharma', targetRole: 'Frontend Engineer' },
    recordProgress: vi.fn(),
  }),
}));

describe('Phase 2: Realistic AI Video Mock Interview System', () => {
  let mockMediaStream: MediaStream;

  beforeEach(() => {
    // Reset stores
    useStationStore.setState({
      user: {
        name: 'Aryan Sharma',
        state: 'Maharashtra',
        city: 'Pune',
        college: 'COEP',
        domain: 'engineering',
        degree: 'B.Tech',
        specialization: 'Computer Science',
        year: '4th Year',
        targetRole: 'Full Stack Engineer',
        targetCompanies: ['Google', 'TCS'],
        dreamCompany: 'Google',
        dreamJob: 'Senior SDE',
        targetSalary: '24 LPA',
        timeline: '6 months',
        skills: [
          { name: 'React', category: 'framework', proficiency: 'Advanced' },
          { name: 'Node.js', category: 'framework', proficiency: 'Intermediate' },
          { name: 'DSA', category: 'core', proficiency: 'Intermediate' },
        ],
        dsaLevel: 'Intermediate',
        csFundamentalsLevel: 'Intermediate',
        aptitudeLevel: 'Intermediate',
        communicationLevel: 'Intermediate',
        personalityScore: { iq: 85, eq: 80, rq: 82 },
        weakPoints: [],
      },
    });

    // Mock MediaStream
    mockMediaStream = {
      getTracks: vi.fn(() => [
        { kind: 'video', stop: vi.fn(), enabled: true } as unknown as MediaStreamTrack,
        { kind: 'audio', stop: vi.fn(), enabled: true } as unknown as MediaStreamTrack,
      ]),
      getVideoTracks: vi.fn(() => [{ kind: 'video', stop: vi.fn(), enabled: true } as unknown as MediaStreamTrack]),
      getAudioTracks: vi.fn(() => [{ kind: 'audio', stop: vi.fn(), enabled: true } as unknown as MediaStreamTrack]),
    } as unknown as MediaStream;

    // Mock navigator.mediaDevices
    Object.defineProperty(navigator, 'mediaDevices', {
      writable: true,
      value: {
        getUserMedia: vi.fn().mockResolvedValue(mockMediaStream),
        enumerateDevices: vi.fn().mockResolvedValue([
          { deviceId: 'cam_1', kind: 'videoinput', label: 'HD WebCam' },
          { deviceId: 'mic_1', kind: 'audioinput', label: 'Studio Microphone' },
        ]),
      },
    });

    // Mock AudioContext
    class MockAudioContext {
      state = 'running';
      createAnalyser() {
        return {
          fftSize: 256,
          frequencyBinCount: 128,
          getByteFrequencyData: (arr: Uint8Array) => arr.fill(40),
        };
      }
      createMediaStreamSource() {
        return {
          connect: vi.fn(),
        };
      }
      close() {
        return Promise.resolve();
      }
    }
    window.AudioContext = MockAudioContext as unknown as typeof AudioContext;
    (window as unknown as { webkitAudioContext: unknown }).webkitAudioContext = MockAudioContext;

    // Mock SpeechSynthesis
    window.speechSynthesis = {
      speak: vi.fn((utterance: SpeechSynthesisUtterance) => {
        setTimeout(() => utterance.onend?.(new Event('end') as SpeechSynthesisEvent), 10);
      }),
      cancel: vi.fn(),
      getVoices: vi.fn(() => [
        { name: 'Google US English', lang: 'en-US' } as SpeechSynthesisVoice,
        { name: 'Indian English', lang: 'en-IN' } as SpeechSynthesisVoice,
      ]),
    } as unknown as SpeechSynthesis;

    window.SpeechSynthesisUtterance = class {
      text: string;
      rate = 1;
      pitch = 1;
      voice: SpeechSynthesisVoice | null = null;
      onstart: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => void) | null = null;
      onend: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => void) | null = null;
      onerror: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisErrorEvent) => void) | null = null;
      constructor(text: string) {
        this.text = text;
      }
    } as unknown as typeof SpeechSynthesisUtterance;

    // Mock SpeechRecognition
    class MockSpeechRecognition {
      continuous = true;
      interimResults = true;
      lang = 'en-US';
      onresult: ((event: unknown) => void) | null = null;
      onerror: ((event: unknown) => void) | null = null;
      onend: (() => void) | null = null;
      start() {}
      stop() {
        this.onend?.();
      }
      abort() {}
    }
    window.SpeechRecognition = MockSpeechRecognition as unknown as typeof window.SpeechRecognition;
    window.webkitSpeechRecognition = MockSpeechRecognition as unknown as typeof window.webkitSpeechRecognition;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Configuration & Profile Personalization', () => {
    it('pre-fills target role and target company from student profile', () => {
      render(
        <BrowserRouter>
          <MockInterview />
        </BrowserRouter>
      );

      // Verify role and company pre-fills
      const roleInput = screen.getByDisplayValue('Full Stack Engineer');
      expect(roleInput).toBeInTheDocument();

      expect(screen.getByText('Google')).toBeInTheDocument();
      expect(screen.getByText('Verified Syllabus')).toBeInTheDocument();
    });

    it('identifies supported companies from company preparation dataset', () => {
      expect(InterviewEngine.isCompanySupported('Google')).toBe(true);
      expect(InterviewEngine.isCompanySupported('TCS')).toBe(true);
      expect(InterviewEngine.isCompanySupported('SBI PO')).toBe(true);
      expect(InterviewEngine.isCompanySupported('UPSC CSE')).toBe(true);
      expect(InterviewEngine.isCompanySupported('Unicorn XYZ Nonexistent')).toBe(false);
    });

    it('calculates planned question count and duration based on duration option', () => {
      expect(InterviewEngine.getPlannedQuestionCount('short')).toBe(4);
      expect(InterviewEngine.getPlannedQuestionCount('standard')).toBe(6);
      expect(InterviewEngine.getPlannedQuestionCount('extended')).toBe(9);

      expect(InterviewEngine.getDurationSeconds('short')).toBe(8 * 60);
      expect(InterviewEngine.getDurationSeconds('standard')).toBe(15 * 60);
      expect(InterviewEngine.getDurationSeconds('extended')).toBe(25 * 60);
    });
  });

  describe('2. Camera & Microphone Pre-Interview Device Check', () => {
    it('requests media streams and enables live video and audio meters', async () => {
      const handleReady = vi.fn();
      const handleBack = vi.fn();

      render(
        <PreInterviewDeviceCheck
          role="Frontend Engineer"
          company="Google"
          onReady={handleReady}
          onBack={handleBack}
        />
      );

      await waitFor(() => {
        expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled();
      });

      // Shows enter interview room button
      const enterBtn = screen.getByRole('button', { name: /enter interview room/i });
      expect(enterBtn).toBeInTheDocument();

      fireEvent.click(enterBtn);
      expect(handleReady).toHaveBeenCalledWith(mockMediaStream, 'cam_1', 'mic_1');
    });

    it('gracefully handles camera/mic permission denial without crashing', async () => {
      // Mock permission denied
      vi.spyOn(navigator.mediaDevices, 'getUserMedia').mockRejectedValueOnce(
        new DOMException('Permission denied', 'NotAllowedError')
      );

      const handleReady = vi.fn();
      const handleBack = vi.fn();

      render(
        <PreInterviewDeviceCheck
          role="Frontend Engineer"
          company="Google"
          onReady={handleReady}
          onBack={handleBack}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Camera or Microphone permissions were blocked/i)).toBeInTheDocument();
      });

      // Still allows user to retry or navigate back
      const retryBtn = screen.getByRole('button', { name: /retry check/i });
      expect(retryBtn).toBeInTheDocument();
    });
  });

  describe('3. Speech Services (TTS & STT)', () => {
    it('detects browser support for speech synthesis and recognition', () => {
      expect(SpeechService.isSTTSupported()).toBe(true);
      expect(SpeechService.isTTSSupported()).toBe(true);
    });

    it('speaks text aloud via SpeechSynthesisUtterance', () => {
      const onEnd = vi.fn();
      SpeechService.speakText('Welcome to your mock interview.', { onEnd });

      expect(window.speechSynthesis.speak).toHaveBeenCalled();
    });

    it('captures spoken transcript and returns it upon stopping', () => {
      const speechService = new SpeechService();
      const onTranscript = vi.fn();

      speechService.startListening({ onTranscript });
      expect(speechService).toBeDefined();

      const transcript = speechService.stopListening();
      expect(typeof transcript).toBe('string');
    });
  });

  describe('4. Conversational Engine & Dynamic Follow-up', () => {
    const config: InterviewConfig = {
      targetRole: 'SDE-1',
      targetCompany: 'Google',
      interviewType: 'DSA',
      difficulty: 'Intermediate',
      duration: 'standard',
    };

    it('generates an opening question customized to profile and company', async () => {
      const profile = useStationStore.getState().user;
      const question = await InterviewEngine.generateFirstQuestion(config, profile);

      expect(question).toBeDefined();
      expect(question.length).toBeGreaterThan(10);
      expect(question).toContain('interview');
    });

    it('generates dynamic follow-ups probing deeper into student response', async () => {
      const profile = useStationStore.getState().user;
      const exchanges = [
        {
          id: 'ex_1',
          stage: 'core' as const,
          question: 'What data structure would you use to implement an LRU cache and why?',
          answerTranscript: 'I would use a hash map paired with a doubly linked list for O(1) lookups and updates.',
          timestamp: Date.now(),
        },
      ];

      const { nextQuestion, nextStage } = await InterviewEngine.generateNextQuestion(
        config,
        profile,
        exchanges,
        exchanges[0].answerTranscript,
        1,
        6
      );

      expect(nextQuestion).toBeDefined();
      expect(nextStage).toBe('followup');
    });
  });

  describe('5. Report Generation & Learning Loop Integration', () => {
    const mockReport: InterviewReport = {
      id: 'rep_123',
      createdAt: new Date().toISOString(),
      config: {
        targetRole: 'Full Stack Engineer',
        targetCompany: 'Google',
        interviewType: 'Technical',
        difficulty: 'Intermediate',
        duration: 'standard',
      },
      durationMinutes: 14,
      overallScore: 78,
      dimensions: {
        technicalKnowledge: 80,
        problemSolving: 76,
        communicationClarity: 82,
        answerStructure: 70,
        companyRecruiterFit: 78,
        composureAndPacing: 84,
      },
      metrics: {
        totalWordsSpoken: 950,
        wordsPerMinute: 135,
        fillerWordCount: 3,
        fillerWordsDetected: ['like', 'um'],
        questionsAnswered: 4,
      },
      exchanges: [
        {
          id: 'q1',
          stage: 'warmup',
          question: 'Walk me through your experience building full-stack web applications.',
          answerTranscript: 'I built an online platform using React and Node.js with PostgreSQL.',
          timestamp: Date.now(),
          analysis: {
            strengths: ['Clear tech stack overview'],
            weaknesses: ['Did not quantify system traffic or latency'],
            technicalCorrection: 'Always state scale constraints and measurable performance metrics.',
            modelAnswer: 'Start with the problem solved, followed by architecture choices and measurable latency/uptime improvements.',
            assessedSkill: 'System Overview',
            studyTopic: 'STAR Technique for Behavioral Rounds',
          },
        },
      ],
      identifiedWeakPoints: [
        {
          concept: 'Time Complexity Analysis',
          category: 'DSA',
          description: 'Candidate hesitated when computing worst-case recurrence tree bounds.',
          severity: 'medium',
          studyTopic: 'Time Complexity',
        },
      ],
      actionableSummary: 'Solid performance showing good architectural foundations. Work on structuring quantifiable impact.',
    };

    it('renders multi-dimensional scores and verbal fluency metrics', () => {
      render(
        <BrowserRouter>
          <InterviewReportView
            report={mockReport}
            onRetake={vi.fn()}
            onBackToConfig={vi.fn()}
          />
        </BrowserRouter>
      );

      expect(screen.getAllByText(/78%/).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/135/)).toBeInTheDocument(); // WPM
      expect(screen.getByText('Technical Depth')).toBeInTheDocument();
      expect(screen.getByText('Composure & Fluency')).toBeInTheDocument();
    });

    it('adds identified weak points into the student store via closed learning loop', () => {
      render(
        <BrowserRouter>
          <InterviewReportView
            report={mockReport}
            onRetake={vi.fn()}
            onBackToConfig={vi.fn()}
          />
        </BrowserRouter>
      );

      const saveBtn = screen.getByRole('button', { name: /save weakness/i });
      expect(saveBtn).toBeInTheDocument();

      fireEvent.click(saveBtn);

      const state = useStationStore.getState();
      expect(state.user?.weakPoints).toContain('Time Complexity Analysis');
    });

    it('records session history in usePerformanceStore', () => {
      const saveMockSession = usePerformanceStore.getState().saveMockInterviewSession;
      saveMockSession({
        id: mockReport.id,
        date: mockReport.createdAt,
        role: mockReport.config.targetRole,
        company: mockReport.config.targetCompany,
        type: mockReport.config.interviewType,
        durationMinutes: mockReport.durationMinutes,
        overallScore: mockReport.overallScore,
        dimensions: mockReport.dimensions,
        questionCount: mockReport.exchanges.length,
        identifiedWeakPoints: ['Time Complexity Analysis'],
      });

      const updatedHistory = usePerformanceStore.getState().mockInterviewHistory;
      expect(updatedHistory).toHaveLength(1);
      expect(updatedHistory[0].overallScore).toBe(78);
    });
  });
});
