import { describe, expect, it } from 'vitest';
import { exampleProjects, validateExampleProject } from '@/lib/network/exampleProjects';
import { getExamProjects } from '@/lib/network/examProjects';
import { cliGuidedLessons } from '@/lib/network/lessonSteps';
import { generateTopology } from '@/components/network/topology/scenarioGenerators';
import { SCENARIOS } from '@/components/network/topology/topologyScenarios';

describe('project catalog integrity', () => {
  it('keeps every example project structurally valid in both languages', () => {
    for (const language of ['tr', 'en'] as const) {
      for (const project of exampleProjects(language)) expect(validateExampleProject(project), `${language}:${project.id}`).toEqual([]);
    }
  });
  it('keeps guided lesson and exam task identifiers unique and actionable', () => {
    expect(new Set(cliGuidedLessons.map(step => step.id)).size).toBe(cliGuidedLessons.length);
    for (const step of cliGuidedLessons) expect(step.checkType).toBeTruthy();
    for (const exam of getExamProjects('en')) {
      expect(new Set(exam.tasks.map(task => task.id)).size, exam.id).toBe(exam.tasks.length);
      for (const task of exam.tasks) expect(task.checkType, `${exam.id}:${task.id}`).toBeTruthy();
    }
  });
  it('keeps every topology-generator scenario connected to valid ports', () => {
    for (const scenario of SCENARIOS) {
      const generated = generateTopology(scenario.id, 3); const devices = new Map(generated.devices.map(d => [d.id, d]));
      for (const link of generated.connections) { expect(devices.get(link.sourceDeviceId)?.ports.some(p => p.id === link.sourcePort), scenario.id).toBe(true); expect(devices.get(link.targetDeviceId)?.ports.some(p => p.id === link.targetPort), scenario.id).toBe(true); }
    }
  });
});
