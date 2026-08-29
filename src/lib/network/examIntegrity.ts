import { generateHmacSignature, verifyHmacSignature } from './crypto';
import { ExamProject } from './examTypes';

/**
 * Generate integrity HMAC-SHA256 hash signature for exam project
 * Cryptographically protects critical exam state fields from tampering.
 */
export function generateExamIntegrityHash(project: ExamProject): string {
  const criticalData = {
    id: project.id,
    durationMinutes: project.durationMinutes,
    tasks: project.tasks.map(t => ({
      id: t.id,
      weight: t.weight,
      completed: t.completed,
      completedAt: t.completedAt ? t.completedAt.getTime() : null
    })),
    startedAt: project.startedAt ? project.startedAt.getTime() : null,
    finishedAt: project.finishedAt ? project.finishedAt.getTime() : null
  };

  const json = JSON.stringify(criticalData);
  return generateHmacSignature(json);
}

/**
 * Verify if exam project integrity is intact using HMAC-SHA256 signature
 */
export function verifyExamIntegrity(project: ExamProject): boolean {
  if (!project.integrityHash) return false;

  const projectCopy = { ...project, integrityHash: undefined };
  const criticalData = {
    id: projectCopy.id,
    durationMinutes: projectCopy.durationMinutes,
    tasks: projectCopy.tasks.map(t => ({
      id: t.id,
      weight: t.weight,
      completed: t.completed,
      completedAt: t.completedAt ? t.completedAt.getTime() : null
    })),
    startedAt: projectCopy.startedAt ? projectCopy.startedAt.getTime() : null,
    finishedAt: projectCopy.finishedAt ? projectCopy.finishedAt.getTime() : null
  };

  const json = JSON.stringify(criticalData);
  return verifyHmacSignature(json, project.integrityHash);
}