import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import VisualRoadmap, { type RoadmapMilestone } from '@/components/roadmap/VisualRoadmap';

describe('Connected Visual Roadmap (P4)', () => {
  const mockMilestones: RoadmapMilestone[] = [
    {
      id: 'station-1',
      stepNumber: 1,
      stationName: 'Station 1: FOUNDATIONS',
      title: 'Programming Syntax & Core Data Types',
      category: 'Foundation',
      estimatedHours: '4 hours',
      description: 'Master primitive types, memory models, and asymptotic analysis.',
      prerequisites: ['Basic high school math'],
      tasks: [
        { id: 't1-1', text: 'Implement two pointer technique on arrays', completed: false },
        { id: 't1-2', text: 'Analyze Big-O time and auxiliary space', completed: true },
      ],
      resources: [
        { title: 'Big-O Cheat Sheet', type: 'article', url: 'https://example.com/big-o' },
        { title: 'Arrays Crash Course', type: 'video', url: 'https://example.com/video1' },
      ],
      quizCount: 3,
    },
    {
      id: 'station-2',
      stepNumber: 2,
      stationName: 'Station 2: ALGORITHMS',
      title: 'Trees, Graphs & Dynamic Programming',
      category: 'Core Skills',
      estimatedHours: '8 hours',
      description: 'Recursion trees, memoization, BFS/DFS graph traversals.',
      prerequisites: ['Programming Syntax & Core Data Types'],
      tasks: [
        { id: 't2-1', text: 'Solve 15 medium tree problems on LeetCode', completed: false },
      ],
      resources: [
        { title: 'Tree Traversal Visualizer', type: 'article' },
      ],
      quizCount: 5,
    },
  ];

  it('renders milestone cards with station names, category badges, and progress bar', () => {
    const completedSet = new Set(['station-1']);

    render(
      <VisualRoadmap
        milestones={mockMilestones}
        completedMilestoneIds={completedSet}
        targetRole="Full Stack Engineer"
        targetCompany="Google"
      />
    );

    expect(screen.getByText(/Milestone Journey: Full Stack Engineer/i)).toBeInTheDocument();
    expect(screen.getByText(/Google Route/i)).toBeInTheDocument();
    expect(screen.getByText(/Station 1: FOUNDATIONS/i)).toBeInTheDocument();
    expect(screen.getByText(/Station 2: ALGORITHMS/i)).toBeInTheDocument();
    expect(screen.getByText(/50% Complete/i)).toBeInTheDocument();
  });

  it('allows expanding and viewing actionable deliverables and prerequisites', () => {
    render(
      <VisualRoadmap
        milestones={mockMilestones}
        completedMilestoneIds={new Set()}
      />
    );

    // Click on Station 2 to expand it
    const station2Title = screen.getByText(/Trees, Graphs & Dynamic Programming/i);
    fireEvent.click(station2Title);

    expect(screen.getByText(/Actionable Station Deliverables:/i)).toBeInTheDocument();
    expect(screen.getByText(/Solve 15 medium tree problems on LeetCode/i)).toBeInTheDocument();
    expect(screen.getByText(/Prerequisites & Prior Stations:/i)).toBeInTheDocument();
  });

  it('calls onToggleMilestone and onToggleTask when items are clicked', () => {
    const toggleMilestoneSpy = vi.fn();
    const toggleTaskSpy = vi.fn();

    render(
      <VisualRoadmap
        milestones={mockMilestones}
        completedMilestoneIds={new Set()}
        onToggleMilestone={toggleMilestoneSpy}
        onToggleTask={toggleTaskSpy}
      />
    );

    // Toggle button for milestone
    const checkButtons = screen.getAllByTitle(/Mark milestone complete/i);
    fireEvent.click(checkButtons[0]);
    expect(toggleMilestoneSpy).toHaveBeenCalledWith('station-1');

    // Toggle task
    const taskItem = screen.getByText(/Implement two pointer technique on arrays/i);
    fireEvent.click(taskItem);
    expect(toggleTaskSpy).toHaveBeenCalledWith('station-1', 't1-1');
  });

  it('filters milestones when clicking In Progress and Completed tabs', () => {
    const completedSet = new Set(['station-1']);

    render(
      <VisualRoadmap
        milestones={mockMilestones}
        completedMilestoneIds={completedSet}
      />
    );

    // Click "Completed" filter
    const completedTab = screen.getByRole('button', { name: /Completed \(1\)/i });
    fireEvent.click(completedTab);

    expect(screen.getByText(/Station 1: FOUNDATIONS/i)).toBeInTheDocument();
    expect(screen.queryByText(/Station 2: ALGORITHMS/i)).not.toBeInTheDocument();

    // Click "In Progress" filter
    const inProgressTab = screen.getByRole('button', { name: /In Progress \(1\)/i });
    fireEvent.click(inProgressTab);

    expect(screen.queryByText(/Station 1: FOUNDATIONS/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Station 2: ALGORITHMS/i)).toBeInTheDocument();
  });
});
