import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import JobReadinessCalculator from '@/components/readiness/JobReadinessCalculator';
import {
  computePreparationReadiness,
  searchCompanies,
  getCompanyByName,
} from '@/data/companyPreparationData';
import { useStationStore } from '@/store/useStationStore';

describe('Job Readiness & Preparation Alignment System', () => {
  beforeEach(() => {
    useStationStore.setState({
      user: {
        name: 'Test Student',
        email: 'test@growthstation.edu',
        college: 'VJTI Mumbai',
        city: 'Mumbai',
        degree: 'B.Tech / B.E.',
        targetRole: 'Full Stack Engineer',
        targetCompanies: ['Google', 'TCS'],
        skills: [
          { name: 'JavaScript', category: 'Language', proficiency: 'Intermediate' },
          { name: 'React', category: 'Framework', proficiency: 'Intermediate' },
          { name: 'Python', category: 'Language', proficiency: 'Beginner' },
        ],
        dsaLevel: 'Intermediate',
        csFundamentalsLevel: 'Beginner',
        aptitudeLevel: 'Intermediate',
        communicationLevel: 'Intermediate',
      },
      domain: 'engineering',
      language: 'en',
    });
  });

  it('computes accurate readiness scores and gaps based on real student skills', () => {
    const student = useStationStore.getState().user!;
    const google = getCompanyByName('Google')!;
    expect(google).toBeDefined();

    const evaluation = computePreparationReadiness(student, google, google.roles[0].role, {});
    expect(evaluation.overallScore).toBeGreaterThanOrEqual(0);
    expect(evaluation.overallScore).toBeLessThanOrEqual(100);

    expect(evaluation.dsaScore).toBeDefined();
    expect(evaluation.csFundamentalsScore).toBeDefined();
    expect(evaluation.technicalSkillScore).toBeDefined();
    expect(evaluation.aptitudeScore).toBeDefined();
    expect(evaluation.interviewScore).toBeDefined();

    // Google expects Advanced DSA, student has Intermediate (gap)
    const dsaGap = evaluation.gaps.find(g => g.area === 'Data Structures & Algorithms');
    expect(dsaGap).toBeDefined();
    expect(dsaGap?.gapSeverity).toBe('High');
  });

  it('searches supported companies and returns empty for unknown companies', () => {
    const googleResults = searchCompanies('Google');
    expect(googleResults.length).toBeGreaterThan(0);
    expect(googleResults[0].name).toBe('Google');

    const unknownResults = searchCompanies('NonExistentCorp12345');
    expect(unknownResults.length).toBe(0);
  });

  it('renders JobReadinessCalculator with Tier Disclaimer and company selector', () => {
    render(
      <MemoryRouter>
        <JobReadinessCalculator />
      </MemoryRouter>
    );

    // Checks header
    expect(screen.getByText(/Preparation Readiness & Skill Match/i)).toBeInTheDocument();

    // Checks disclaimer text presence
    expect(screen.getByText(/Growth Station preparation syllabi/i)).toBeInTheDocument();

    // Checks pillar labels
    expect(screen.getByText(/DSA & Algorithms/i)).toBeInTheDocument();
    expect(screen.getByText(/CS Fundamentals \(DBMS\/OS\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Technical Skill Match/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Aptitude & Problem Solving/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Interview & Communication/i)).toBeInTheDocument();
  });

  it('displays graceful fallback when searching for an unsupported company without fabricating probability', () => {
    render(
      <MemoryRouter>
        <JobReadinessCalculator />
      </MemoryRouter>
    );

    const searchInput = screen.getByPlaceholderText(/Search supported recruiters/i);
    fireEvent.change(searchInput, { target: { value: 'QuantumTechXYZ' } });

    expect(screen.getByText(/Company not currently in preparation syllabus/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Request.*Syllabus Addition/i })).toBeInTheDocument();
  });

  it('safely handles baselineAssessment with skillBreakdown instead of categoryBreakdown without crashing', () => {
    // This replicates the exact production crash where categoryBreakdown was undefined
    useStationStore.setState({
      user: {
        name: 'Assessed Student',
        email: 'assessed@growthstation.edu',
        college: 'VJTI Mumbai',
        city: 'Mumbai',
        degree: 'B.Tech / B.E.',
        targetRole: 'Full Stack Engineer',
        targetCompanies: ['Google'],
        skills: [{ name: 'JavaScript', category: 'Language', proficiency: 'Intermediate' }],
        baselineAssessment: {
          completedAt: new Date().toISOString(),
          score: 78,
          skillBreakdown: {
            'Data Structures & Algorithms': 72,
            'Core CS Fundamentals': 65,
            'Problem Solving & Aptitude': 80,
          },
          assessedLevel: 'Proficient',
        } as any,
      },
      domain: 'engineering',
      language: 'en',
    });

    render(
      <MemoryRouter>
        <JobReadinessCalculator />
      </MemoryRouter>
    );

    expect(screen.getByText(/Preparation Readiness & Skill Match/i)).toBeInTheDocument();
    expect(screen.getByText(/DSA & Algorithms/i)).toBeInTheDocument();
  });

  it('enforces Commerce stream isolation without DSA contamination', () => {
    useStationStore.setState({
      user: {
        name: 'Commerce Student',
        email: 'commerce@growthstation.edu',
        college: 'SRCC Delhi',
        city: 'Delhi',
        degree: 'B.Com / BBA',
        domain: 'commerce',
        targetRole: 'Financial Analyst',
        dreamCompany: 'HDFC Bank',
        targetCompanies: ['HDFC Bank', 'Deloitte'],
        skills: [
          { name: 'Financial Modeling', category: 'Technical', proficiency: 'Intermediate', assessedLevel: 'Proficient', score: 80 },
          { name: 'Excel / Sheets', category: 'Tool', proficiency: 'Advanced', assessedLevel: 'Advanced', score: 90 },
        ],
      },
      domain: 'commerce',
      language: 'en',
    });

    render(
      <MemoryRouter>
        <JobReadinessCalculator />
      </MemoryRouter>
    );

    // Commerce pillars must be present
    expect(screen.getByText(/Financial & Domain Skills/i)).toBeInTheDocument();
    expect(screen.getByText(/Banking & Corporate Regulations/i)).toBeInTheDocument();
    expect(screen.getByText(/Quantitative Aptitude & DI/i)).toBeInTheDocument();

    // Engineering-specific DSA must NOT be in the pillars or dimensions
    expect(screen.queryByText(/DSA & Algorithms/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/CS Fundamentals \(DBMS\/OS\)/i)).not.toBeInTheDocument();

    // Target company for commerce should be HDFC Bank
    expect(screen.getAllByText(/HDFC Bank/i).length).toBeGreaterThanOrEqual(1);
  });

  it('enforces Arts & Humanities stream isolation without DSA contamination', () => {
    useStationStore.setState({
      user: {
        name: 'Arts Student',
        email: 'arts@growthstation.edu',
        college: 'St. Stephen\'s College',
        city: 'Delhi',
        degree: 'BA / MA',
        domain: 'arts',
        targetRole: 'Civil Services Aspirant',
        dreamCompany: 'State PCS',
        targetCompanies: ['State PCS', 'SSC CGL'],
        skills: [
          { name: 'Indian Constitution', category: 'Domain', proficiency: 'Advanced', assessedLevel: 'Advanced', score: 85 },
          { name: 'Essay Writing', category: 'Analytical', proficiency: 'Advanced', assessedLevel: 'Advanced', score: 85 },
        ],
      },
      domain: 'arts',
      language: 'en',
    });

    render(
      <MemoryRouter>
        <JobReadinessCalculator />
      </MemoryRouter>
    );

    // Arts pillars must be present
    expect(screen.getByText(/Core Syllabus \/ Polity & GS/i)).toBeInTheDocument();
    expect(screen.getByText(/Constitutional & Governance Principles/i)).toBeInTheDocument();
    expect(screen.getByText(/CSAT & Analytical Aptitude/i)).toBeInTheDocument();

    // Engineering-specific DSA must NOT be in the pillars or dimensions
    expect(screen.queryByText(/DSA & Algorithms/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/CS Fundamentals \(DBMS\/OS\)/i)).not.toBeInTheDocument();

    // Default commission for arts should be State PCS or SSC CGL or UPSC
    expect(screen.getAllByText(/State PCS/i).length).toBeGreaterThanOrEqual(1);
  });

  it('guarantees searchCompanies isolates results by stream domain', () => {
    const engineeringCos = searchCompanies('', 'engineering');
    expect(engineeringCos.length).toBeGreaterThan(0);
    expect(engineeringCos.every(c => !c.domain || c.domain === 'engineering')).toBe(true);
    expect(engineeringCos.some(c => c.name === 'Google')).toBe(true);
    expect(engineeringCos.some(c => c.name === 'HDFC Bank')).toBe(false);

    const commerceCos = searchCompanies('', 'commerce');
    expect(commerceCos.length).toBeGreaterThan(0);
    expect(commerceCos.every(c => c.domain === 'commerce')).toBe(true);
    expect(commerceCos.some(c => c.name === 'HDFC Bank')).toBe(true);
    expect(commerceCos.some(c => c.name === 'Google')).toBe(false);

    const artsCos = searchCompanies('', 'arts');
    expect(artsCos.length).toBeGreaterThan(0);
    expect(artsCos.every(c => c.domain === 'arts')).toBe(true);
    expect(artsCos.some(c => c.name === 'State PCS')).toBe(true);
    expect(artsCos.some(c => c.name === 'Google')).toBe(false);
  });
});
