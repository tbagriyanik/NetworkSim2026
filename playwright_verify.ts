import { test, expect } from '@playwright/test';

test('Comprehensive Network Master Exam is visible in Project Picker', async ({ page }) => {
  await page.goto('http://localhost:3000');

  // Wait for the skeleton to disappear and the header to be visible
  await page.waitForSelector('header', { timeout: 30000 });

  // Open Project Picker (Folder icon)
  await page.click('button[title*="Yeni Proje"], button[title*="New Project"]');

  // Click on "Exams" (Sınavlar) tab
  await page.click('button:has-text("Sınavlar"), button:has-text("Exams")');

  // Verify that "Comprehensive Network Master Exam" exists
  const examTitle = page.locator('text=Comprehensive Network Master Exam');
  await expect(examTitle).toBeVisible();

  // Start the exam
  await page.click('button:has-text("Başlat"), button:has-text("Start") >> xpath=../.. >> text=Comprehensive Network Master Exam');

  // Wait for Exam Mode Panel to appear
  await page.waitForSelector('div:has-text("Sınav Modu"), div:has-text("Exam Mode")');

  // Verify that some tasks are listed
  const taskChecklist = page.locator('text=Görevler (0/20), text=Checklist (0/20)');
  // Depending on language, it might be different, let's use a looser selector
  await expect(page.locator('button:has-text("Görevler"), button:has-text("Checklist")')).toBeVisible();

  // Check for specific task title
  await expect(page.locator('text=PC-AS1 Connection, text=PC-AS1 Bağlantısı')).toBeVisible();

  // Take a screenshot
  await page.screenshot({ path: '/home/jules/verification/master_exam_panel.png' });
});
