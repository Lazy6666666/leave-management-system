import { Page, APIRequestContext } from '@playwright/test';

declare global {
  namespace PlaywrightTest {
    interface Matchers<R> {
      toBeAccessible(): Promise<R>;
    }

    interface Fixtures {
      authenticatedPage: Page;
      managerPage: Page;
      request: APIRequestContext;
    }
  }
}
