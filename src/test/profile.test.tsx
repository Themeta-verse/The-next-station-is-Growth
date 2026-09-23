import { describe, it, expect, beforeEach } from 'vitest';
import { useStationStore, type StudentSkill } from '@/store/useStationStore';

describe('Student Profile & Personalization Foundation (P1)', () => {
  beforeEach(() => {
    useStationStore.setState({
      score: 100,
      tasksDone: 2,
      streak: 3,
      domain: 'engineering',
      user: null,
      language: 'en',
    });
  });

  it('stores comprehensive student profile with degree, semester and target role', () => {
    const mockSkills: StudentSkill[] = [
      { name: 'Java', category: 'language', proficiency: 'Advanced' },
      { name: 'Data Structures & Algorithms', category: 'core', proficiency: 'Intermediate' },
      { name: 'SQL / DBMS', category: 'database', proficiency: 'Intermediate' },
    ];

    useStationStore.getState().login({
      name: 'Himanshu Rao',
      state: 'Maharashtra',
      city: 'Pune',
      college: 'COEP Technological University',
      domain: 'engineering',
      degree: 'B.Tech',
      specialization: 'Computer Science',
      year: '3rd Year',
      semester: 'Semester 5',
      graduationYear: '2026',
      targetRole: 'Software Engineer',
      targetCompanies: ['Google', 'TCS', 'Amazon'],
      dreamCompany: 'Google',
      dreamJob: 'Software Engineer',
      targetSalary: '18 LPA',
      timeline: '6',
      skills: mockSkills,
      dsaLevel: 'Intermediate',
      csFundamentalsLevel: 'Beginner',
      aptitudeLevel: 'Intermediate',
      communicationLevel: 'Advanced',
      personalityScore: { iq: 75, eq: 80, rq: 70 },
      weakPoints: ['Dynamic Programming', 'OS Paging'],
    });

    const user = useStationStore.getState().user;
    expect(user).not.toBeNull();
    expect(user?.name).toBe('Himanshu Rao');
    expect(user?.degree).toBe('B.Tech');
    expect(user?.semester).toBe('Semester 5');
    expect(user?.targetRole).toBe('Software Engineer');
    expect(user?.targetCompanies).toEqual(['Google', 'TCS', 'Amazon']);
    expect(user?.skills).toHaveLength(3);
    expect(user?.dsaLevel).toBe('Intermediate');
  });

  it('updates student skills via updateUserSkills action', () => {
    useStationStore.getState().login({
      name: 'Pooja Verma',
      state: 'Karnataka',
      city: 'Bangalore',
      college: 'BMS College',
      domain: 'engineering',
      specialization: 'Information Science',
      year: 'Final Year',
      dreamCompany: 'Microsoft',
      dreamJob: 'Frontend Developer',
      targetSalary: '14 LPA',
      timeline: '3',
      personalityScore: { iq: 60, eq: 65, rq: 70 },
      weakPoints: [],
    });

    const newSkills: StudentSkill[] = [
      { name: 'TypeScript', category: 'language', proficiency: 'Advanced' },
      { name: 'React', category: 'framework', proficiency: 'Advanced' },
    ];

    useStationStore.getState().updateUserSkills(newSkills);

    const updatedUser = useStationStore.getState().user;
    expect(updatedUser?.skills).toHaveLength(2);
    expect(updatedUser?.skills?.[0].name).toBe('TypeScript');
    expect(updatedUser?.skills?.[0].proficiency).toBe('Advanced');
  });

  it('updates student readiness baseline levels via updateUserReadinessLevels action', () => {
    useStationStore.getState().login({
      name: 'Rohan Gupta',
      state: 'Delhi',
      city: 'New Delhi',
      college: 'Delhi University',
      domain: 'commerce',
      specialization: 'Finance',
      year: '2nd Year',
      dreamCompany: 'EY',
      dreamJob: 'Financial Analyst',
      targetSalary: '9 LPA',
      timeline: '6',
      personalityScore: { iq: 50, eq: 50, rq: 50 },
      weakPoints: [],
    });

    useStationStore.getState().updateUserReadinessLevels({
      dsaLevel: 'Beginner',
      csFundamentalsLevel: 'Intermediate',
      aptitudeLevel: 'Advanced',
      communicationLevel: 'Advanced',
    });

    const user = useStationStore.getState().user;
    expect(user?.aptitudeLevel).toBe('Advanced');
    expect(user?.communicationLevel).toBe('Advanced');
    expect(user?.dsaLevel).toBe('Beginner');
  });
});
