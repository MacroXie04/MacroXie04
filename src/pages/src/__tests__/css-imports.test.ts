import {describe, it, expect} from 'vitest';

describe('CSS imports resolve', () => {
  it('main entry CSS resolves', async () => {
    await expect(import('../index.css')).resolves.toBeDefined();
  });

  const componentsWithCSS = [
    ['Layout/Container', () => import('@/features/layout/components/Container/Container.tsx')],
    ['Layout/MainMenu', () => import('@/features/layout/components/MainMenu/MainMenu.tsx')],
    ['Layout/Footer', () => import('@/features/layout/components/Footer/Footer.tsx')],
    ['CMS/CMSPageComponent', () => import('@/features/cms/components/CMSPageComponent.tsx')],
    ['ScheduleGrid', () => import('@/features/events/components/ScheduleGrid/ScheduleGrid.tsx')],
    ['SheetsDataTable', () => import('@/components/ui/SheetsDataTable/SheetsDataTable.tsx')],
    ['MaintenanceMode', () => import('@/app/MaintenanceMode/MaintenanceMode.tsx')],
    ['HealthCheckProvider', () => import('@/app/MaintenanceMode/HealthCheckProvider.tsx')],
    ['Projects components', () => import('@/features/projects/components')],
    ['AccountPage', () => import('@/features/auth/components/pages/AccountPage.tsx')],
    [
      'PastProjectCurationSharedLinksPage',
      () => import('@/features/auth/components/pages/PastProjectCurationSharedLinksPage.tsx'),
    ],
    ['EventRegistrationPage', () => import('@/routes/EventRegistrationPage')],
  ] as const;

  it.each(componentsWithCSS)('%s CSS import resolves', async (_name, importFn) => {
    await expect(importFn()).resolves.toBeDefined();
  });
});
