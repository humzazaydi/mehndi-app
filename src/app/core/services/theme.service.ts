import { Injectable, signal } from '@angular/core';

const THEME_KEY = 'mehndi-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  isDark = signal(false);

  constructor() {
    const saved = localStorage.getItem(THEME_KEY);
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
    this.setDark(saved ? saved === 'dark' : prefersDark, false);
  }

  toggle(): void {
    this.setDark(!this.isDark());
  }

  setDark(value: boolean, persist = true): void {
    this.isDark.set(value);
    document.body.classList.toggle('dark-theme', value);
    document.documentElement.classList.toggle('dark-theme', value);
    if (persist) {
      localStorage.setItem(THEME_KEY, value ? 'dark' : 'light');
    }
  }
}
