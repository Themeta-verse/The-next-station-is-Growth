import type { Domain, ReadinessLevel, SkillProficiency, UserProfile } from '@/store/useStationStore';

export type CompanyTier =
  | 'Tier 1 (Product & Core Tech)'
  | 'Tier 2 (Growth & Tech Services)'
  | 'Tier 3 (Enterprise & Mass Recruiters)'
  | 'Financial & Banking'
  | 'Civil Services & Public Sector';

export interface CompanyRoleProfile {
  role: string;
  requiredSkills: string[];
  dsaExpectation: ReadinessLevel;
  csFundamentalsExpectation: ReadinessLevel;
  aptitudeExpectation: ReadinessLevel;
  interviewExpectation: ReadinessLevel;
  stages: string[];
  prepHighlights: string[];
}

export interface CompanyProfile {
  id: string;
  name: string;
  domain: Domain;
  tierCategory: CompanyTier;
  tierDisclaimer: string;
  roles: CompanyRoleProfile[];
  hiringRounds: string[];
  overview: string;
  typicalPackageRange: string;
}

export const TIER_DISCLAIMER_TEXT =
  'Tiers represent Growth Station preparation syllabi and recruitment stage expectations, not an objective industry hierarchy.';

export const SUPPORTED_COMPANIES: CompanyProfile[] = [
  // TIER 1 - PRODUCT & CORE TECH
  {
    id: 'google',
    name: 'Google',
    domain: 'engineering',
    tierCategory: 'Tier 1 (Product & Core Tech)',
    tierDisclaimer: TIER_DISCLAIMER_TEXT,
    typicalPackageRange: '25 - 45+ LPA',
    overview: 'High bar for algorithmic problem solving, system design fundamentals, and scalable clean code.',
    hiringRounds: ['Online Assessment (2 LeetCode Medium/Hard)', 'Technical Phone Screen (DSA)', 'Onsite Round 1 (Trees & Graphs)', 'Onsite Round 2 (DP & Complex DS)', 'Googleyness & Leadership'],
    roles: [
      {
        role: 'Software Engineer (L3 / SDE-1)',
        requiredSkills: ['Data Structures & Algorithms', 'C++', 'Java', 'Python', 'Operating Systems', 'System Design'],
        dsaExpectation: 'Advanced',
        csFundamentalsExpectation: 'Advanced',
        aptitudeExpectation: 'Advanced',
        interviewExpectation: 'Advanced',
        stages: ['Online Assessment', 'Technical Coding 1', 'Technical Coding 2', 'Googleyness & Behavioral'],
        prepHighlights: ['Master Graph algorithms (Dijkstra, DFS/BFS, Topological Sort)', 'Dynamic Programming optimization', 'Time/space complexity proofs'],
      },
      {
        role: 'Associate Cloud Engineer',
        requiredSkills: ['Computer Networks', 'Operating Systems', 'Python', 'Linux / Shell', 'Docker / Cloud', 'SQL / DBMS'],
        dsaExpectation: 'Intermediate',
        csFundamentalsExpectation: 'Advanced',
        aptitudeExpectation: 'Intermediate',
        interviewExpectation: 'Intermediate',
        stages: ['Online Screening', 'System Architecture & Networking', 'Troubleshooting Simulation', 'Behavioral'],
        prepHighlights: ['Deep understanding of TCP/IP, DNS, and HTTP/3', 'Linux kernel internals and troubleshooting', 'Basic container orchestration'],
      },
    ],
  },
  {
    id: 'microsoft',
    name: 'Microsoft',
    domain: 'engineering',
    tierCategory: 'Tier 1 (Product & Core Tech)',
    tierDisclaimer: TIER_DISCLAIMER_TEXT,
    typicalPackageRange: '20 - 42+ LPA',
    overview: 'Strong emphasis on clean OOP, data structures, low-level design, and collaborative engineering mindset.',
    hiringRounds: ['Codility Online Test', 'Technical Round 1 (DSA)', 'Technical Round 2 (OOP & System Design)', 'Managerial & Cultural Fit'],
    roles: [
      {
        role: 'Software Development Engineer (SDE-1)',
        requiredSkills: ['Data Structures & Algorithms', 'C++', 'C#', 'Java', 'OOP', 'SQL / DBMS'],
        dsaExpectation: 'Advanced',
        csFundamentalsExpectation: 'Intermediate',
        aptitudeExpectation: 'Intermediate',
        interviewExpectation: 'Advanced',
        stages: ['Online Coding', 'DSA & Trees/Graphs', 'Low Level Design (OOP)', 'AA (As Appropriate) Round'],
        prepHighlights: ['Object-Oriented Design patterns (SOLID)', 'Binary Trees, BST, Linked Lists, Heaps', 'Edge case resilience in live coding'],
      },
    ],
  },
  {
    id: 'amazon',
    name: 'Amazon',
    domain: 'engineering',
    tierCategory: 'Tier 1 (Product & Core Tech)',
    tierDisclaimer: TIER_DISCLAIMER_TEXT,
    typicalPackageRange: '24 - 44+ LPA',
    overview: 'Evaluates standard LeetCode Medium algorithms coupled heavily with 16 Amazon Leadership Principles (STAR format).',
    hiringRounds: ['Online Assessment (2 DSA + Work Style Simulation)', 'Technical Round 1 (DSA + LP)', 'Technical Round 2 (DSA + System Design)', 'Bar Raiser Round'],
    roles: [
      {
        role: 'Software Development Engineer - 1',
        requiredSkills: ['Data Structures & Algorithms', 'Java', 'Operating Systems', 'System Design', 'Git & GitHub'],
        dsaExpectation: 'Advanced',
        csFundamentalsExpectation: 'Intermediate',
        aptitudeExpectation: 'Advanced',
        interviewExpectation: 'Advanced',
        stages: ['Online Assessment', 'DSA & Problem Solving', 'DSA & OOP Architecture', 'Bar Raiser (Deep LP Probe)'],
        prepHighlights: ['Leadership Principles embedded in every answer', 'HashMaps, PriorityQueue, Trie, and BFS/DFS', 'Production-grade code readability'],
      },
    ],
  },
  {
    id: 'uber',
    name: 'Uber',
    domain: 'engineering',
    tierCategory: 'Tier 1 (Product & Core Tech)',
    tierDisclaimer: TIER_DISCLAIMER_TEXT,
    typicalPackageRange: '28 - 48+ LPA',
    overview: 'Demands rigorous algorithmic clarity, concurrency understanding, and high-performance system trade-offs.',
    hiringRounds: ['CodeSignal OA', 'Coding Round 1 (DSA)', 'Coding Round 2 (Concurrency/Algorithms)', 'System Design / Architecture', 'Hiring Manager'],
    roles: [
      {
        role: 'Software Engineer 1',
        requiredSkills: ['Data Structures & Algorithms', 'Go', 'Java', 'Python', 'Computer Networks', 'System Design'],
        dsaExpectation: 'Advanced',
        csFundamentalsExpectation: 'Advanced',
        aptitudeExpectation: 'Advanced',
        interviewExpectation: 'Advanced',
        stages: ['CodeSignal OA', 'Algorithmic Problem Solving', 'Concurrency & Low-level Design', 'System Architecture'],
        prepHighlights: ['Concurrency primitives, thread safety, locks', 'Graph shortest path and network flows', 'Distributed cache architectures'],
      },
    ],
  },

  // TIER 2 - GROWTH & TECH SERVICES
  {
    id: 'cisco',
    name: 'Cisco',
    domain: 'engineering',
    tierCategory: 'Tier 2 (Growth & Tech Services)',
    tierDisclaimer: TIER_DISCLAIMER_TEXT,
    typicalPackageRange: '12 - 20 LPA',
    overview: 'Focuses on solid core computer networking, operating systems, and practical scripting and algorithms.',
    hiringRounds: ['Online Test (Aptitude + Networking + Coding)', 'Technical Round 1 (Networks & OS)', 'Technical Round 2 (DSA & Projects)', 'HR Round'],
    roles: [
      {
        role: 'Software Engineer - Networking / Cloud',
        requiredSkills: ['Computer Networks', 'Operating Systems', 'C++', 'Python', 'Linux / Shell'],
        dsaExpectation: 'Intermediate',
        csFundamentalsExpectation: 'Advanced',
        aptitudeExpectation: 'Intermediate',
        interviewExpectation: 'Intermediate',
        stages: ['Online Assessment', 'Computer Networks Deep Dive', 'Coding & DSA', 'Managerial Interview'],
        prepHighlights: ['Subnetting, Routing protocols (OSPF, BGP)', 'Socket programming and TCP 3-way handshake', 'Process scheduling and memory management'],
      },
    ],
  },
  {
    id: 'oracle',
    name: 'Oracle',
    domain: 'engineering',
    tierCategory: 'Tier 2 (Growth & Tech Services)',
    tierDisclaimer: TIER_DISCLAIMER_TEXT,
    typicalPackageRange: '14 - 22 LPA',
    overview: 'Specializes in database internals, concurrency, transaction isolation, and core Java/C++ algorithms.',
    hiringRounds: ['Online Aptitude & Coding Test', 'Technical Round 1 (DBMS & DSA)', 'Technical Round 2 (Core Programming & Systems)', 'HR / Leadership'],
    roles: [
      {
        role: 'Member of Technical Staff (MTS)',
        requiredSkills: ['SQL / DBMS', 'Data Structures & Algorithms', 'Java', 'Operating Systems', 'C++'],
        dsaExpectation: 'Intermediate',
        csFundamentalsExpectation: 'Advanced',
        aptitudeExpectation: 'Intermediate',
        interviewExpectation: 'Intermediate',
        stages: ['OA', 'DBMS Internals & Indexing', 'Algorithmic Problem Solving', 'Behavioral'],
        prepHighlights: ['B-Trees, B+ Trees, indexing strategies', 'ACID properties and 2PL locking protocols', 'Deadlock detection algorithms'],
      },
    ],
  },
  {
    id: 'deloitte',
    name: 'Deloitte',
    domain: 'engineering',
    tierCategory: 'Tier 2 (Growth & Tech Services)',
    tierDisclaimer: TIER_DISCLAIMER_TEXT,
    typicalPackageRange: '7.5 - 12 LPA',
    overview: 'Assesses broad full-stack or data capability, business problem solving, and structured professional communication.',
    hiringRounds: ['Online Aptitude & Versant Communication Test', 'Technical Interview (Projects & Web/Data)', 'Partner / HR Round'],
    roles: [
      {
        role: 'Technology Analyst',
        requiredSkills: ['SQL / DBMS', 'Python', 'JavaScript', 'React', 'Git & GitHub'],
        dsaExpectation: 'Beginner',
        csFundamentalsExpectation: 'Intermediate',
        aptitudeExpectation: 'Advanced',
        interviewExpectation: 'Advanced',
        stages: ['Cognitive & Technical Assessment', 'Technical Discussion', 'Partner Interview'],
        prepHighlights: ['Case study problem solving', 'Full-stack project architecture walkthrough', 'Verbal and written communication clarity'],
      },
    ],
  },

  // TIER 3 - ENTERPRISE & MASS RECRUITERS
  {
    id: 'tcs',
    name: 'TCS',
    domain: 'engineering',
    tierCategory: 'Tier 3 (Enterprise & Mass Recruiters)',
    tierDisclaimer: TIER_DISCLAIMER_TEXT,
    typicalPackageRange: '3.6 - 9.0 LPA (Ninja / Digital / Prime)',
    overview: 'National qualifier test (NQT) based entry assessing foundational numerical aptitude, verbal ability, and standard coding.',
    hiringRounds: ['TCS NQT (Foundation + Advanced Section)', 'Technical Interview (Core Engineering, Projects)', 'Managerial & HR Interview'],
    roles: [
      {
        role: 'System Engineer (Digital / Prime)',
        requiredSkills: ['Data Structures & Algorithms', 'Java', 'Python', 'SQL / DBMS', 'Git & GitHub'],
        dsaExpectation: 'Intermediate',
        csFundamentalsExpectation: 'Intermediate',
        aptitudeExpectation: 'Advanced',
        interviewExpectation: 'Intermediate',
        stages: ['TCS NQT Advanced Test', 'Technical & Project Defense', 'HR & Verification'],
        prepHighlights: ['Fast numerical ability and time-speed-distance', 'Arrays, Strings, Recursion, basic Sorting', 'SQL queries (Joins, Group By, Subqueries)'],
      },
    ],
  },
  {
    id: 'infosys',
    name: 'Infosys',
    domain: 'engineering',
    tierCategory: 'Tier 3 (Enterprise & Mass Recruiters)',
    tierDisclaimer: TIER_DISCLAIMER_TEXT,
    typicalPackageRange: '3.6 - 9.5 LPA (SE / DSE / Specialist Programmer)',
    overview: 'HackWithInfy / InfyTQ / Campus drive assessing pseudo-code, mathematical reasoning, and hands-on coding.',
    hiringRounds: ['Online Aptitude & Coding Test', 'Technical Interview', 'HR Round'],
    roles: [
      {
        role: 'Specialist Programmer / DSE',
        requiredSkills: ['Data Structures & Algorithms', 'Python', 'Java', 'SQL / DBMS'],
        dsaExpectation: 'Intermediate',
        csFundamentalsExpectation: 'Intermediate',
        aptitudeExpectation: 'Intermediate',
        interviewExpectation: 'Intermediate',
        stages: ['Online Coding Challenge', 'Technical Interview', 'HR Discussion'],
        prepHighlights: ['Greedy algorithms and Dynamic Programming fundamentals', 'Logical deduction and mathematical series', 'OOP encapsulation and inheritance'],
      },
    ],
  },
  {
    id: 'wipro',
    name: 'Wipro',
    domain: 'engineering',
    tierCategory: 'Tier 3 (Enterprise & Mass Recruiters)',
    tierDisclaimer: TIER_DISCLAIMER_TEXT,
    typicalPackageRange: '3.5 - 6.5 LPA (Elite / Turbo)',
    overview: 'Wipro Elite NTH assessing essay writing, aptitude, reasoning, and foundational coding questions.',
    hiringRounds: ['Online Aptitude + Coding + Written Communication', 'Technical Interview', 'HR Interview'],
    roles: [
      {
        role: 'Project Engineer (Elite/Turbo)',
        requiredSkills: ['Data Structures & Algorithms', 'Java', 'C++', 'SQL / DBMS'],
        dsaExpectation: 'Beginner',
        csFundamentalsExpectation: 'Beginner',
        aptitudeExpectation: 'Intermediate',
        interviewExpectation: 'Intermediate',
        stages: ['Online National Talent Hunt', 'Technical Discussion', 'HR'],
        prepHighlights: ['Sentence construction and grammar for written test', 'Standard 1D arrays and string manipulation', 'Basic DBMS terminology and normal forms'],
      },
    ],
  },

  // FINANCIAL & BANKING (COMMERCE TRACK)
  {
    id: 'sbi-po',
    name: 'SBI PO',
    domain: 'commerce',
    tierCategory: 'Financial & Banking',
    tierDisclaimer: TIER_DISCLAIMER_TEXT,
    typicalPackageRange: '8.5 - 13 LPA',
    overview: 'Premier public sector bank examination demanding speed in quantitative aptitude, reasoning puzzles, and English comprehension.',
    hiringRounds: ['Prelims (Speed Quant, Reasoning, English)', 'Mains (Data Interpretation, Banking Awareness, Descriptive)', 'Psychometric Test + Group Discussion + Personal Interview'],
    roles: [
      {
        role: 'Probationary Officer (PO)',
        requiredSkills: ['Quantitative Aptitude', 'Banking Awareness', 'Business Communication', 'Excel & Financial Modeling'],
        dsaExpectation: 'Beginner',
        csFundamentalsExpectation: 'Beginner',
        aptitudeExpectation: 'Advanced',
        interviewExpectation: 'Advanced',
        stages: ['Preliminary Exam (Timed Speed)', 'Mains & Descriptive Essay', 'GD / Group Exercise', 'Personal Interview'],
        prepHighlights: ['High-level Data Interpretation (Radar, Mixed Graphs, Caselets)', 'Monetary Policy, RBI Guidelines, NPA recovery mechanisms', 'Current economic affairs and formal essay articulation'],
      },
    ],
  },
  {
    id: 'ey',
    name: 'EY',
    domain: 'commerce',
    tierCategory: 'Financial & Banking',
    tierDisclaimer: TIER_DISCLAIMER_TEXT,
    typicalPackageRange: '7.0 - 11 LPA',
    overview: 'Big Four audit and consulting firm prioritizing financial reporting standards, taxation basics, and case walkthroughs.',
    hiringRounds: ['Aptitude & Technical Assessment', 'Case Study Round', 'Managerial Technical Interview', 'Partner Interview'],
    roles: [
      {
        role: 'Assurance / Audit Associate',
        requiredSkills: ['Financial Accounting', 'Corporate Law', 'Direct & Indirect Taxation', 'Excel & Financial Modeling'],
        dsaExpectation: 'Beginner',
        csFundamentalsExpectation: 'Beginner',
        aptitudeExpectation: 'Intermediate',
        interviewExpectation: 'Advanced',
        stages: ['Technical Screening', 'Case Presentation', 'Partner Round'],
        prepHighlights: ['Ind AS / IFRS core balance sheet principles', 'Audit sampling and internal control frameworks', 'Advanced Excel lookup formulas and pivot models'],
      },
    ],
  },

  // CIVIL SERVICES & PUBLIC SECTOR (ARTS TRACK)
  {
    id: 'upsc-cse',
    name: 'UPSC CSE',
    domain: 'arts',
    tierCategory: 'Civil Services & Public Sector',
    tierDisclaimer: TIER_DISCLAIMER_TEXT,
    typicalPackageRange: 'Apex Administrative Services (IAS / IPS / IFS)',
    overview: 'India’s most comprehensive constitutional, analytical, and administrative leadership examination.',
    hiringRounds: ['Prelims (GS-1 + CSAT Qualifying)', 'Mains (9 Written Subjective Papers)', 'Personality Test / Interview (Dholpur House)'],
    roles: [
      {
        role: 'Civil Services Officer (IAS / IPS / IFS)',
        requiredSkills: ['Indian Polity & Constitution', 'Modern Indian History', 'Ethics, Integrity & Aptitude', 'Indian Economy', 'Essay & Answer Writing'],
        dsaExpectation: 'Beginner',
        csFundamentalsExpectation: 'Beginner',
        aptitudeExpectation: 'Advanced',
        interviewExpectation: 'Advanced',
        stages: ['Civil Services Preliminary Exam', 'Mains Subjective Examination', 'UPSC Personality Test'],
        prepHighlights: ['Constitutional provisions, articles, and milestone Supreme Court judgments', 'Ethics case study resolution under administrative constraints', 'Balanced, multi-dimensional essay and answer structuring'],
      },
    ],
  },
];

export function getCompanyByName(name: string): CompanyProfile | undefined {
  if (!name || typeof name !== 'string') return undefined;
  const normalized = name.trim().toLowerCase();
  return SUPPORTED_COMPANIES.find(
    c => c.name.toLowerCase() === normalized || c.id === normalized
  );
}

export function searchCompanies(query: string, domain?: Domain): CompanyProfile[] {
  const q = (query || '').trim().toLowerCase();
  return SUPPORTED_COMPANIES.filter(c => {
    const matchesDomain = !domain || c.domain === domain;
    if (!q) return matchesDomain;
    const matchesName = c.name.toLowerCase().includes(q);
    const matchesTier = c.tierCategory.toLowerCase().includes(q);
    const matchesRole = c.roles.some(r => r.role.toLowerCase().includes(q));
    return matchesDomain && (matchesName || matchesTier || matchesRole);
  });
}

export function getAllSupportedCompanies(): CompanyProfile[] {
  return SUPPORTED_COMPANIES;
}

export interface ReadinessScoreResult {
  overallScore: number;
  technicalSkillScore: number;
  dsaScore: number;
  csFundamentalsScore: number;
  aptitudeScore: number;
  interviewScore: number;
  gaps: Array<{
    area: string;
    studentLevel: string;
    expectedLevel: string;
    gapSeverity: 'Low' | 'Medium' | 'High';
    explanation: string;
    actionAdvice: string;
  }>;
  hasEnoughData: boolean;
  missingDataNotes: string[];
}

function levelToNumber(level?: ReadinessLevel | SkillProficiency): number {
  if (!level) return 0;
  const normalized = String(level).trim().toLowerCase();
  if (normalized === 'advanced') return 90;
  if (normalized === 'intermediate') return 60;
  if (normalized === 'beginner') return 30;
  return 0;
}

export function computePreparationReadiness(
  user: UserProfile | null,
  company: CompanyProfile,
  roleName: string,
  topicPerformance?: Record<string, { correct: number; attempts: number }>
): ReadinessScoreResult {
  const role = company.roles.find(r => r.role === roleName) || company.roles[0];
  const missingDataNotes: string[] = [];

  if (!user) {
    return {
      overallScore: 0,
      technicalSkillScore: 0,
      dsaScore: 0,
      csFundamentalsScore: 0,
      aptitudeScore: 0,
      interviewScore: 0,
      gaps: [],
      hasEnoughData: false,
      missingDataNotes: ['Please log in to calculate evidence-based preparation readiness.'],
    };
  }

  // 1. Technical Skill Score
  const studentSkills = user.skills || [];
  let skillMatchCount = 0;
  let totalSkillWeight = 0;

  role.requiredSkills.forEach(req => {
    totalSkillWeight += 1;
    const found = studentSkills.find(s => s.name.toLowerCase().includes(req.toLowerCase()) || req.toLowerCase().includes(s.name.toLowerCase()));
    if (found) {
      const multiplier = found.proficiency === 'Advanced' ? 1.0 : found.proficiency === 'Intermediate' ? 0.7 : 0.4;
      skillMatchCount += multiplier;
    }
  });

  const technicalSkillScore = Math.min(100, Math.round((skillMatchCount / Math.max(1, totalSkillWeight)) * 100));

  // 2. DSA Readiness
  let dsaScore = levelToNumber(user.dsaLevel);
  if (topicPerformance) {
    const dsaPerf = Object.entries(topicPerformance).find(([k]) => k.toLowerCase().includes('dsa') || k.toLowerCase().includes('algorithm'));
    if (dsaPerf && dsaPerf[1].attempts > 0) {
      const accuracy = Math.round((dsaPerf[1].correct / dsaPerf[1].attempts) * 100);
      dsaScore = Math.round((dsaScore * 0.4) + (accuracy * 0.6));
    }
  }

  // 3. CS Fundamentals Readiness
  let csFundamentalsScore = levelToNumber(user.csFundamentalsLevel);
  if (topicPerformance) {
    const csPerf = Object.entries(topicPerformance).filter(([k]) =>
      k.toLowerCase().includes('dbms') ||
      k.toLowerCase().includes('os') ||
      k.toLowerCase().includes('system') ||
      k.toLowerCase().includes('network')
    );
    if (csPerf.length > 0) {
      let totalC = 0, totalA = 0;
      csPerf.forEach(([, p]) => { totalC += p.correct; totalA += p.attempts; });
      if (totalA > 0) {
        const acc = Math.round((totalC / totalA) * 100);
        csFundamentalsScore = Math.round((csFundamentalsScore * 0.4) + (acc * 0.6));
      }
    }
  }

  // 4. Aptitude Score
  let aptitudeScore = levelToNumber(user.aptitudeLevel);
  if (topicPerformance) {
    const aptPerf = Object.entries(topicPerformance).find(([k]) => k.toLowerCase().includes('aptitude') || k.toLowerCase().includes('quantitative'));
    if (aptPerf && aptPerf[1].attempts > 0) {
      const acc = Math.round((aptPerf[1].correct / aptPerf[1].attempts) * 100);
      aptitudeScore = Math.round((aptitudeScore * 0.4) + (acc * 0.6));
    }
  }

  // 5. Interview Score
  const interviewScore = levelToNumber(user.communicationLevel);

  // Overall Weighted synthesis
  const overallScore = Math.round(
    technicalSkillScore * 0.30 +
    dsaScore * 0.25 +
    csFundamentalsScore * 0.20 +
    aptitudeScore * 0.15 +
    interviewScore * 0.10
  );

  // Gap Analysis
  const gaps: ReadinessScoreResult['gaps'] = [];

  const compareGap = (
    area: string,
    studentScore: number,
    studentLevel: string,
    expectedLevel: ReadinessLevel,
    advice: string
  ) => {
    const expectedScore = levelToNumber(expectedLevel);
    const diff = expectedScore - studentScore;
    if (diff > 25) {
      gaps.push({
        area,
        studentLevel: studentLevel || 'Not assessed',
        expectedLevel,
        gapSeverity: 'High',
        explanation: `Your assessed level is ${studentLevel || 'Beginner'} (${studentScore}%) while ${company.name} ${role.role} expects ${expectedLevel} (${expectedScore}%+).`,
        actionAdvice: advice,
      });
    } else if (diff > 5) {
      gaps.push({
        area,
        studentLevel: studentLevel || 'Moderate',
        expectedLevel,
        gapSeverity: 'Medium',
        explanation: `You are approaching requirements in ${area}, but need more timed practice to hit ${expectedLevel} consistency.`,
        actionAdvice: advice,
      });
    } else {
      gaps.push({
        area,
        studentLevel: studentLevel || 'Target Met',
        expectedLevel,
        gapSeverity: 'Low',
        explanation: `Your ${area} readiness aligns well with ${company.name}'s ${role.role} requirements.`,
        actionAdvice: 'Keep practicing to maintain edge and speed.',
      });
    }
  };

  compareGap(
    'Data Structures & Algorithms',
    dsaScore,
    user.dsaLevel || 'Beginner',
    role.dsaExpectation,
    `Complete DSA quizzes and practice ${role.prepHighlights[0] || 'problem sets'}.`
  );

  compareGap(
    'CS Fundamentals / Core Domain',
    csFundamentalsScore,
    user.csFundamentalsLevel || 'Beginner',
    role.csFundamentalsExpectation,
    `Review DBMS transactions, OS scheduling, and networking principles.`
  );

  compareGap(
    'Aptitude & Problem Solving',
    aptitudeScore,
    user.aptitudeLevel || 'Beginner',
    role.aptitudeExpectation,
    `Practice timed Quantitative and Logical Reasoning sets.`
  );

  if (studentSkills.length < 2) {
    missingDataNotes.push('Add your technical skills in your Profile to improve Skill Match accuracy.');
  }

  const hasEnoughData = studentSkills.length > 0 || Boolean(user.dsaLevel);

  return {
    overallScore,
    technicalSkillScore,
    dsaScore,
    csFundamentalsScore,
    aptitudeScore,
    interviewScore,
    gaps,
    hasEnoughData,
    missingDataNotes,
  };
}
