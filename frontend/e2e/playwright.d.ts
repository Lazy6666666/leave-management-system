import { Page, APIRequestContext } from '@playwright/test';

declare global {
  namespace PlaywrightTest {
    interface Fixtures {
      authenticatedPage: Page;
      managerPage: Page;
      request: APIRequestContext;
    }
  }
}
