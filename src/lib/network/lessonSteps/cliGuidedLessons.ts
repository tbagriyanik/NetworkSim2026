import type { GuidedStep } from '../guidedMode.types';
import { cliLessonsSwitch } from './cliLessonsSwitch';
import { cliLessonsPC } from './cliLessonsPC';
import { cliLessonsRouter } from './cliLessonsRouter';

export const cliGuidedLessons: GuidedStep[] = [
  ...cliLessonsSwitch,
  ...cliLessonsPC,
  ...cliLessonsRouter
];