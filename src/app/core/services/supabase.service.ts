import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  readonly client: SupabaseClient = createClient(
    environment.supabaseUrl,
    environment.supabaseAnonKey,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    }
  );

  get auth() { return this.client.auth; }
  get storage() { return this.client.storage; }
  get channel() { return this.client.channel.bind(this.client); }

  from<T = unknown>(table: string) {
    return this.client.from<string, T & Record<string, unknown>>(table);
  }

  rpc(fn: string, params?: Record<string, unknown>) {
    return this.client.rpc(fn, params);
  }
}
