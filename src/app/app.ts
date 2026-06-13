import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { SettingsService } from './core/services/settings.service';
import { NotificationService } from './core/services/notification.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet />`,
})
export class App implements OnInit {
  private auth = inject(AuthService);
  private settings = inject(SettingsService);
  private notifications = inject(NotificationService);

  async ngOnInit(): Promise<void> {
    await this.auth.initialize();
    await this.settings.loadAll();

    const user = this.auth.currentUser();
    if (user) {
      await this.notifications.requestBrowserPermission();
      await this.notifications.load();
      this.notifications.subscribeToRealtime(user.id);
    }
  }
}
