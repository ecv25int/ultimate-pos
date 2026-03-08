import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs';
import { Auth } from '../auth/auth';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface Language {
  code: string;
  label: string;
  dir: 'ltr' | 'rtl';
}

export const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'en', label: 'English', dir: 'ltr' },
  { code: 'es', label: 'Español', dir: 'ltr' },
];

const LOCALE_KEY = 'app_locale';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private translate = inject(TranslateService);
  private auth = inject(Auth);
  private http = inject(HttpClient);

  readonly languages = SUPPORTED_LANGUAGES;
  private _current$ = new BehaviorSubject<Language>(SUPPORTED_LANGUAGES[0]);
  readonly current$ = this._current$.asObservable();

  /** Call once at app startup (in app.config.ts providers factory or AppComponent) */
  init(): void {
    this.translate.addLangs(SUPPORTED_LANGUAGES.map((l) => l.code));
    this.translate.setDefaultLang('en');

    // Priority: localStorage > browser default > 'en'
    const saved = localStorage.getItem(LOCALE_KEY) ?? navigator.language.split('-')[0];
    const lang = SUPPORTED_LANGUAGES.find((l) => l.code === saved) ?? SUPPORTED_LANGUAGES[0];
    // If the saved locale is no longer supported, write the fallback so it doesn't re-apply next load
    const persist = !SUPPORTED_LANGUAGES.some((l) => l.code === saved);
    this.applyLanguage(lang, persist);
  }

  use(langCode: string): void {
    const lang = SUPPORTED_LANGUAGES.find((l) => l.code === langCode);
    if (!lang) return;
    this.applyLanguage(lang, true);

    // Persist to backend if logged in
    const user = this.auth.getCurrentUser();
    if (user) {
      this.http
        .put(`${environment.apiUrl}/auth/profile`, { locale: langCode })
        .subscribe({ error: () => {} }); // fire-and-forget
    }
  }

  get current(): Language {
    return this._current$.value;
  }

  private applyLanguage(lang: Language, persist: boolean): void {
    this.translate.use(lang.code);
    this._current$.next(lang);
    document.documentElement.lang = lang.code;
    document.documentElement.dir = lang.dir;
    if (persist) {
      localStorage.setItem(LOCALE_KEY, lang.code);
    }
  }
}
