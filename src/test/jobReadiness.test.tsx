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
});
