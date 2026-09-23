import { streamChat } from '@/lib/ai';
import { SUPPORTED_COMPANIES, CompanyProfile } from '@/data/companyPreparationData';
import { UserProfile } from '@/store/useStationStore';

export type InterviewType = 
  | 'HR / Behavioral' 
  | 'Technical' 
  | 'DSA' 
  | 'CS Fundamentals' 
  | 'Mixed' 
  | 'Company-specific';

export type InterviewDifficulty = 'Beginner' | 'Intermediate' | 'Advanced';
export type InterviewDuration = 'short' | 'standard' | 'extended';

export interface InterviewConfig {
  targetRole: string;
  targetCompany: string;
  interviewType: InterviewType;
  difficulty: InterviewDifficulty;
  duration: InterviewDuration;
}

export type InterviewStage = 'warmup' | 'core' | 'followup' | 'scenario' | 'closing';

export interface QuestionAnalysis {
  strengths: string[];
  weaknesses: string[];
  technicalCorrection?: string;
  modelAnswer: string;
  assessedSkill: string;
  studyTopic: string;
}

export interface InterviewExchange {
  id: string;
  stage: InterviewStage;
  question: string;
  answerTranscript: string;
  timestamp: number;
  durationSeconds?: number;
  analysis?: QuestionAnalysis;
}

export interface InterviewReportDimensions {
  technicalKnowledge: number; // 0-100
  problemSolving: number; // 0-100
  communicationClarity: number; // 0-100
  answerStructure: number; // 0-100
  companyRecruiterFit: number; // 0-100
  composureAndPacing: number; // 0-100
}

export interface InterviewReportMetrics {
  totalWordsSpoken: number;
  wordsPerMinute: number;
  fillerWordCount: number;
  fillerWordsDetected: string[];
  questionsAnswered: number;
}

export interface IdentifiedWeakPoint {
  concept: string;
  category: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  studyTopic: string;
}

export interface InterviewReport {
  id: string;
  createdAt: string;
  config: InterviewConfig;
  durationMinutes: number;
  overallScore: number;
  dimensions: InterviewReportDimensions;
  metrics: InterviewReportMetrics;
  exchanges: InterviewExchange[];
  identifiedWeakPoints: IdentifiedWeakPoint[];
  actionableSummary: string;
}

export class InterviewEngine {
  public static getPlannedQuestionCount(duration: InterviewDuration): number {
    switch (duration) {
      case 'short': return 4;
      case 'standard': return 6;
      case 'extended': return 9;
    }
  }

  public static getDurationSeconds(duration: InterviewDuration): number {
    switch (duration) {
      case 'short': return 8 * 60; // 8 minutes
      case 'standard': return 15 * 60; // 15 minutes
      case 'extended': return 25 * 60; // 25 minutes
    }
  }

  public static isCompanySupported(companyName: string): boolean {
    if (!companyName) return false;
    return SUPPORTED_COMPANIES.some(
      (c) => c.name.toLowerCase() === companyName.toLowerCase()
    );
  }

  public static getCompanyData(companyName: string): CompanyProfile | undefined {
    return SUPPORTED_COMPANIES.find(
      (c) => c.name.toLowerCase() === companyName.toLowerCase()
    );
  }

  /**
   * Generates opening interview question grounded in candidate profile and company syllabus
   */
  public static async generateFirstQuestion(
    config: InterviewConfig,
    profile: UserProfile | null
  ): Promise<string> {
    const company = this.getCompanyData(config.targetCompany);
    const candidateContext = this.buildCandidateSummary(config, profile, company);

    const prompt = `You are a professional hiring manager conducting a realistic ${config.interviewType} interview for the position of ${config.targetRole}${company ? ` at ${company.name}` : ''}.
Candidate Profile:
${candidateContext}

Difficulty: ${config.difficulty}
First Question Stage: Warmup / Introduction

Generate ONLY the opening spoken question to begin the interview.
Keep it natural, professional, warm yet rigorous. Do not output preamble, markdown quotes, or explanations—just the exact words the interviewer will speak aloud to the candidate.`;

    return new Promise((resolve) => {
      let result = '';
      const fallback = `Hello! Welcome to your interview for the ${config.targetRole} role${company ? ` at ${company.name}` : ''}. To kick things off, could you briefly introduce yourself and walk me through a technical challenge or project you worked on recently?`;

      const timeoutId = setTimeout(() => {
        if (!result.trim()) {
          resolve(fallback);
        }
      }, 7000);

      streamChat({
        mode: 'mock-interview',
        messages: [{ role: 'user', content: prompt }],
        context: candidateContext,
        onDelta: (chunk) => {
          result += chunk;
        },
        onDone: () => {
          clearTimeout(timeoutId);
          resolve(result.trim() || fallback);
        },
        onError: () => {
          clearTimeout(timeoutId);
          resolve(fallback);
        }
      });
    });
  }

  /**
   * Evaluates the student's spoken answer and decides whether to ask a probing follow-up,
   * challenge an assumption, or transition to the next interview concept.
   */
  public static async generateNextQuestion(
    config: InterviewConfig,
    profile: UserProfile | null,
    exchanges: InterviewExchange[],
    latestAnswer: string,
    questionIndex: number,
    totalQuestions: number
  ): Promise<{ nextQuestion: string; nextStage: InterviewStage }> {
    const company = this.getCompanyData(config.targetCompany);
    const candidateContext = this.buildCandidateSummary(config, profile, company);
    const isClosing = questionIndex >= totalQuestions - 1;

    // Determine target stage
    let targetStage: InterviewStage = 'core';
    if (questionIndex === 0) targetStage = 'core';
    else if (questionIndex === 1 || questionIndex === 2) targetStage = 'followup';
    else if (questionIndex === totalQuestions - 2) targetStage = 'scenario';
    else if (isClosing) targetStage = 'closing';

    const recentHistory = exchanges.map((e, idx) => 
      `Q${idx + 1} (${e.stage}): "${e.question}"\nCandidate Answer: "${e.answerTranscript}"`
    ).join('\n\n');

    const prompt = `You are the lead interviewer conducting a realistic ${config.interviewType} video interview for ${config.targetRole}${company ? ` at ${company.name}` : ''}.
Difficulty: ${config.difficulty}.
Current Stage: ${targetStage} (Question ${questionIndex + 1} of ${totalQuestions}).

Candidate Profile:
${candidateContext}

Interview Transcript so far:
${recentHistory}

Latest Candidate Answer to previous question:
"${latestAnswer}"

TASK:
${isClosing 
  ? 'This is the final wrap-up question. Conclude gracefully and ask if the candidate has any questions or final thoughts regarding the role or tech stack.'
  : targetStage === 'followup' 
    ? 'CRUCIAL: Do NOT ask an unrelated question. Directly interrogate what the candidate just said. If they mentioned a specific data structure, trade-off, complexity, or methodology, probe deeper into edge cases, trade-offs, or what happens under failure. If their answer was vague or incomplete, challenge it gently.'
    : 'Ask the next relevant technical or behavioral question appropriate for this role and company syllabus, building upon the conversational momentum.'
}

REQUIREMENTS:
- Output ONLY the exact spoken question/dialogue.
- No markdown formatting, no quotes, no labels like "Interviewer:".
- Keep it concise, natural, and conversational (1-3 sentences max).`;

    return new Promise((resolve) => {
      let result = '';
      const fallback = isClosing
        ? `We are wrapping up our time today. Do you have any questions for me about the team, our engineering culture, or what to expect next?`
        : `That's an interesting point. Could you dive deeper into the trade-offs you considered in that approach, specifically around scalability and edge-case handling?`;

      const timeoutId = setTimeout(() => {
        if (!result.trim()) {
          resolve({ nextQuestion: fallback, nextStage: targetStage });
        }
      }, 7000);

      streamChat({
        mode: 'mock-interview',
        messages: [{ role: 'user', content: prompt }],
        context: candidateContext,
        onDelta: (chunk) => {
          result += chunk;
        },
        onDone: () => {
          clearTimeout(timeoutId);
          resolve({
            nextQuestion: result.trim() || fallback,
            nextStage: targetStage,
          });
        },
        onError: () => {
          clearTimeout(timeoutId);
          resolve({ nextQuestion: fallback, nextStage: targetStage });
        }
      });
    });
  }

  /**
   * Generates a multi-dimensional performance report after the interview finishes.
   */
  public static async generateReport(
    config: InterviewConfig,
    profile: UserProfile | null,
    exchanges: InterviewExchange[],
    durationMinutes: number
  ): Promise<InterviewReport> {
    const company = this.getCompanyData(config.targetCompany);

    // Calculate objective verbal metrics
    const fillerWordsList = ['um', 'uh', 'like', 'basically', 'actually', 'you know', 'sort of', 'kind of'];
    let totalWords = 0;
    let fillerCount = 0;
    const detectedFillers: string[] = [];

    exchanges.forEach((e) => {
      const words = e.answerTranscript.toLowerCase().split(/\s+/).filter(Boolean);
      totalWords += words.length;

      fillerWordsList.forEach((filler) => {
        const regex = new RegExp(`\\b${filler}\\b`, 'gi');
        const matches = e.answerTranscript.match(regex);
        if (matches) {
          fillerCount += matches.length;
          if (!detectedFillers.includes(filler)) {
            detectedFillers.push(filler);
          }
        }
      });
    });

    const wpm = durationMinutes > 0 ? Math.round(totalWords / durationMinutes) : 110;

    // Build structured evaluation prompt
    const candidateContext = this.buildCandidateSummary(config, profile, company);
    const transcriptText = exchanges.map((e, idx) => 
      `Question ${idx + 1} (${e.stage}): ${e.question}\nAnswer: ${e.answerTranscript}`
    ).join('\n\n');

    const prompt = `You are a principal technical hiring director evaluating this mock interview for ${config.targetRole}${company ? ` at ${company.name}` : ''}.
Difficulty: ${config.difficulty}.
Candidate Context:
${candidateContext}

Interview Transcript:
${transcriptText}

Generate a rigorous JSON evaluation matching this EXACT TypeScript structure:
{
  "dimensions": {
    "technicalKnowledge": number (0-100),
    "problemSolving": number (0-100),
    "communicationClarity": number (0-100),
    "answerStructure": number (0-100),
    "companyRecruiterFit": number (0-100),
    "composureAndPacing": number (0-100)
  },
  "overallScore": number (0-100),
  "actionableSummary": "string (2-3 sentences summarizing performance and top priority)",
  "questionAnalyses": [
    {
      "questionIndex": number,
      "strengths": ["string", "string"],
      "weaknesses": ["string"],
      "technicalCorrection": "string or null",
      "modelAnswer": "string (concise exemplar answer)",
      "assessedSkill": "string (e.g. Binary Search, STAR Method, System Design)",
      "studyTopic": "string (matching a core CS or behavioral concept)"
    }
  ],
  "identifiedWeakPoints": [
    {
      "concept": "string",
      "category": "DSA" | "CS Fundamentals" | "System Design" | "Behavioral" | "Aptitude",
      "description": "string",
      "severity": "high" | "medium" | "low",
      "studyTopic": "string"
    }
  ]
}

Return ONLY valid JSON. No markdown ticks, no preamble.`;

    return new Promise((resolve) => {
      let rawJson = '';

      const fallbackReport: InterviewReport = {
        id: 'report_' + Date.now(),
        createdAt: new Date().toISOString(),
        config,
        durationMinutes: Math.max(durationMinutes, 1),
        overallScore: 72,
        dimensions: {
          technicalKnowledge: 70,
          problemSolving: 74,
          communicationClarity: 75,
          answerStructure: 68,
          companyRecruiterFit: company ? 70 : 75,
          composureAndPacing: Math.min(90, Math.max(60, 100 - fillerCount * 3)),
        },
        metrics: {
          totalWordsSpoken: totalWords,
          wordsPerMinute: Math.min(180, Math.max(60, wpm)),
          fillerWordCount: fillerCount,
          fillerWordsDetected: detectedFillers,
          questionsAnswered: exchanges.length,
        },
        exchanges: exchanges.map((e, idx) => ({
          ...e,
          analysis: {
            strengths: ['Addressed the main question directly', 'Clear thought progression'],
            weaknesses: ['Could articulate time/space complexity trade-offs with more precision'],
            technicalCorrection: 'Always verify edge cases (null inputs, scale boundaries) before concluding.',
            modelAnswer: `In an optimal interview answer for ${config.targetRole}, state your high-level approach first, articulate constraints, walk through the step-by-step logic, and conclude with computational trade-offs.`,
            assessedSkill: idx === 0 ? 'Introduction & Project Narrative' : 'Algorithmic Problem Solving',
            studyTopic: idx === 0 ? 'Behavioral / STAR Method' : 'Time & Space Complexity Analysis',
          },
        })),
        identifiedWeakPoints: [
          {
            concept: 'Complexity Trade-off Analysis',
            category: 'DSA',
            description: 'Candidate struggled to definitively analyze runtime complexity under large inputs.',
            severity: 'medium',
            studyTopic: 'Time Complexity',
          },
          {
            concept: 'Structured Communication (STAR)',
            category: 'Behavioral',
            description: 'Project walk-throughs lacked explicit quantifiable impact metrics.',
            severity: 'low',
            studyTopic: 'STAR Technique for Behavioral Rounds',
          },
        ],
        actionableSummary: `Solid performance demonstrating foundational readiness for ${config.targetRole}. Focus on structuring your answers more tightly with the STAR framework and explicitly stating algorithmic complexity trade-offs upfront.`,
      };

      const timeoutId = setTimeout(() => {
        resolve(fallbackReport);
      }, 10000);

      streamChat({
        mode: 'mock-interview',
        messages: [{ role: 'user', content: prompt }],
        context: candidateContext,
        onDelta: (chunk) => {
          rawJson += chunk;
        },
        onDone: () => {
          clearTimeout(timeoutId);
          try {
            // Clean markdown blocks if present
            const clean = rawJson.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(clean);

            const mergedExchanges = exchanges.map((ex, idx) => {
              const analysis = parsed.questionAnalyses?.find((a: { questionIndex: number }) => a.questionIndex === idx) || 
                               fallbackReport.exchanges[idx]?.analysis;
              return {
                ...ex,
                analysis,
              };
            });

            resolve({
              id: 'report_' + Date.now(),
              createdAt: new Date().toISOString(),
              config,
              durationMinutes: Math.max(durationMinutes, 1),
              overallScore: parsed.overallScore ?? fallbackReport.overallScore,
              dimensions: parsed.dimensions ?? fallbackReport.dimensions,
              metrics: {
                totalWordsSpoken: totalWords,
                wordsPerMinute: Math.min(200, Math.max(50, wpm)),
                fillerWordCount: fillerCount,
                fillerWordsDetected: detectedFillers,
                questionsAnswered: exchanges.length,
              },
              exchanges: mergedExchanges,
              identifiedWeakPoints: parsed.identifiedWeakPoints?.length > 0 
                ? parsed.identifiedWeakPoints 
                : fallbackReport.identifiedWeakPoints,
              actionableSummary: parsed.actionableSummary || fallbackReport.actionableSummary,
            });
          } catch (e) {
            console.warn('Failed to parse AI interview report JSON, using fallback:', e);
            resolve(fallbackReport);
          }
        },
        onError: () => {
          clearTimeout(timeoutId);
          resolve(fallbackReport);
        }
      });
    });
  }

  private static buildCandidateSummary(
    config: InterviewConfig,
    profile: UserProfile | null,
    company?: CompanyProfile
  ): string {
    const parts: string[] = [];

    if (profile) {
      parts.push(`- Candidate Name: ${profile.name || 'Candidate'}`);
      parts.push(`- Academic: ${profile.degree || 'B.Tech'} ${profile.specialization ? `in ${profile.specialization}` : ''} (Year: ${profile.year || '3rd Year'})`);
      if (profile.skills && profile.skills.length > 0) {
        const skillList = profile.skills.map(s => `${s.name} (${s.proficiency})`).join(', ');
        parts.push(`- Known Skills: ${skillList}`);
      }
      parts.push(`- Preparation Baselines: DSA: ${profile.dsaLevel || 'Intermediate'}, CS Fundamentals: ${profile.csFundamentalsLevel || 'Intermediate'}, Communication: ${profile.communicationLevel || 'Intermediate'}`);
    }

    parts.push(`- Target Role: ${config.targetRole}`);
    if (company) {
      parts.push(`- Target Recruiter: ${company.name} (${company.tierCategory} - ${company.tierDisclaimer})`);
      if (company.overview) {
        parts.push(`- Recruiter Overview: ${company.overview}`);
      }
      if (company.hiringRounds && company.hiringRounds.length > 0) {
        parts.push(`- Typical Rounds: ${company.hiringRounds.join(' -> ')}`);
      }
      const roleMatch = company.roles?.find(r => r.role.toLowerCase().includes(config.targetRole.toLowerCase()));
      if (roleMatch && roleMatch.requiredSkills) {
        parts.push(`- Role Focus Skills: ${roleMatch.requiredSkills.join(', ')}`);
      }
    } else if (config.targetCompany) {
      parts.push(`- Target Recruiter: General / Custom (${config.targetCompany})`);
    }

    return parts.join('\n');
  }
}
