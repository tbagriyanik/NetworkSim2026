export const IOS_ERRORS = {
  invalidInput: "% Invalid input detected at '^' marker.",
  incomplete: '% Incomplete command.',
  unknown: "% Invalid input detected at '^' marker.",
  accessDenied: '% Access denied',
  badPasswords: '% Bad passwords'
} as const;

export const iosModeError = (): string => IOS_ERRORS.invalidInput;
