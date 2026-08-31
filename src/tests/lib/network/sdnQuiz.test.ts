import { describe, expect, it } from 'vitest';
import { answerSdnQuiz, getQuizQuestionsForProject, lessonQuizzes } from '@/lib/network/sdnQuiz';

describe('Lesson-Specific Knowledge Quizzes', () => {
  it('provides 2-3 specific questions per lesson topic', () => {
    const pcCmdQuestions = getQuizQuestionsForProject('pcCmd');
    expect(pcCmdQuestions.length).toBe(3);
    expect(pcCmdQuestions[0].id).toBe('pccmd-1');

    const vlanQuestions = getQuizQuestionsForProject('vlan');
    expect(vlanQuestions.length).toBe(3);

    const dhcpQuestions = getQuizQuestionsForProject('routerDhcp');
    expect(dhcpQuestions.length).toBe(3);
  });

  it('evaluates answers and awards points correctly', () => {
    const resultCorrect = answerSdnQuiz('pccmd-1', 0, 'pcCmd', 'tr');
    expect(resultCorrect.correct).toBe(true);
    expect(resultCorrect.points).toBe(10);
    expect(resultCorrect.explanation).toContain('ipconfig');

    const resultWrong = answerSdnQuiz('pccmd-1', 1, 'pcCmd', 'tr');
    expect(resultWrong.correct).toBe(false);
    expect(resultWrong.points).toBe(0);
  });

  it('covers all predefined lesson topics with valid choices and correct answers', () => {
    for (const [lessonId, questions] of Object.entries(lessonQuizzes)) {
      expect(questions.length, `Lesson ${lessonId} should have 2-3 questions`).toBeGreaterThanOrEqual(2);
      expect(questions.length, `Lesson ${lessonId} should have 2-3 questions`).toBeLessThanOrEqual(3);

      for (const q of questions) {
        expect(q.answer).toBeGreaterThanOrEqual(0);
        const choicesTr = Array.isArray(q.choices) ? q.choices : q.choices.tr;
        expect(q.answer).toBeLessThan(choicesTr.length);
      }
    }
  });
});
