import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { providePrimeNG } from 'primeng/config';
import TransfloTheme from '../theme/transflo-theme';
import { provideMockApi } from './mock-api';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideAnimations(),
    providePrimeNG({
      theme: {
        preset: TransfloTheme,
        options: {
          darkModeSelector: '.p-dark',
          cssLayer: false,
        },
      },
    }),
    // Mock .NET API bindings — swap for an HTTP-backed provider later (see mock-api/).
    ...provideMockApi(),
  ],
};
