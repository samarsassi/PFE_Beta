import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import Keycloak from 'keycloak-js';
import { firstValueFrom } from 'rxjs';
import { User } from 'src/app/Data/User';

@Injectable({
  providedIn: 'root'
})
export class KeycloakService {
  constructor(private http: HttpClient,private router: Router) { }
  private _keycloak: Keycloak | undefined;
  private _profile: User | undefined;

  get keycloak() {
    if (!this._keycloak) {
      this._keycloak = new Keycloak({
        url: 'http://localhost:9092',
        realm: 'PFE',
        clientId: 'PFE'
      });
    }
    return this._keycloak;
  }

  async getAllUsers(): Promise<any[]> {
    const token = this.token;
    if (!token) return [];

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    const realm = 'PFE';
    const url = `http://localhost:9092/admin/realms/${realm}/users`;

    return await firstValueFrom(this.http.get<any[]>(url, { headers }));
  }

  async getOnlineUsers(): Promise<string[]> {
    const token = this.token;
    if (!token) return [];
    const clientId = await this.getClientUUID(); // your existing method
    const response = await fetch(`http://localhost:9092/admin/realms/PFE/clients/${clientId}/user-sessions`, {
      headers: {
        Authorization: `Bearer ${token}`,
      }
    });
    const sessions = await response.json();
    return sessions.map((session: any) => session.userId); // list of online user IDs
  }


  async getClientUUID(): Promise<string | null> {
    const token = this.token;
    const response = await fetch(`http://localhost:9092/admin/realms/PFE/clients`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const clients = await response.json();
    const client = clients.find((c: any) => c.clientId === 'PFE');
    return client ? client.id : null;
  }

  async getUserRoles(userId: string): Promise<any[]> {
    const clientUUID = await this.getClientUUID();
    const token = this.token;

    if (!clientUUID) {
      console.error("Client UUID not found");
      return [];
    }

    const response = await fetch(`http://localhost:9092/admin/realms/PFE/users/${userId}/role-mappings/clients/${clientUUID}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    return await response.json();
  }


  async getAvailableClientRoles(): Promise<any[]> {
    const token = this.token;
    const clientUUID = await this.getClientUUID(); // reuse the UUID method

    if (!clientUUID) {
      console.error('Client UUID not found');
      return [];
    }

    const response = await fetch(`http://localhost:9092/admin/realms/PFE/clients/${clientUUID}/roles`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    return await response.json();
  }

    async getLoginEventsToday(): Promise<any[]> {
    const token = this.token;
    if (!token) return [];

    const realm = 'PFE';
    const today = new Date().toISOString().slice(0, 10);

    const response = await fetch(`http://localhost:9092/admin/realms/${realm}/events?type=LOGIN`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('Failed to fetch login events');
      return [];
    }

    const events = await response.json();

    return events.filter((event: any) => {
      const eventDate = new Date(event.time || event.timestamp).toISOString().slice(0, 10);
      return eventDate === today;
    });
  }

  async getLoginUsersToday(): Promise<number> {
  const token = this.token;
  if (!token) return 0;

  const realm = 'PFE';
  const today = new Date().toISOString().slice(0, 10);

  const response = await fetch(`http://localhost:9092/admin/realms/${realm}/events?type=LOGIN`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    console.error('Failed to fetch login events');
    return 0;
  }

  const events = await response.json();

  // Filter only today's events
  const todayEvents = events.filter((event: any) => {
    const eventDate = new Date(event.time || event.timestamp).toISOString().slice(0, 10);
    return eventDate === today;
  });

  // Extract unique user IDs
  const uniqueUserIds = new Set(todayEvents.map((event: any) => event.userId));
  return uniqueUserIds.size;
}



  async assignClientRoleToUser(userId: string, role: any): Promise<void> {
    const token = this.token;
    const clientUUID = await this.getClientUUID(); // Make sure you have this helper method

    await fetch(`http://localhost:9092/admin/realms/PFE/users/${userId}/role-mappings/clients/${clientUUID}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([role])  // Must include the full role object with id, name, etc.
    });
  }


  async removeClientRoleFromUser(userId: string, role: any): Promise<void> {
    const token = this.token;
    const clientUUID = await this.getClientUUID();

    await fetch(`http://localhost:9092/admin/realms/PFE/users/${userId}/role-mappings/clients/${clientUUID}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([role])
    });
  }

  get profile(): User | undefined {
    return this._profile;
  }

  async init() {
    const authenticated = await this.keycloak.init({
      onLoad: 'login-required'
    });

    if (authenticated) {
      this._profile = (await this.keycloak?.loadUserProfile());
      localStorage.setItem('token', this.token ?? '');
      //this.router.navigate(['/home']);
    }
  }
  login() {
    
    return this.keycloak?.login({ redirectUri: 'http://localhost:4200/main' });
  }
  logout() {
    // Clear local storage and session storage
  localStorage.clear();
  sessionStorage.clear();
  // Perform Keycloak logout
    return this.keycloak?.logout({ redirectUri: 'http://localhost:4200/main' });
  }

  ViewProfile() {
    return this.keycloak?.accountManagement();
  }
  get token(): string | undefined {
    return this.keycloak?.token;
  }
  get roles(): string[] {
    const token = this.token;
    if (!token) return [];

    const decodedToken = JSON.parse(atob(token.split('.')[1]));

    const realmRoles = decodedToken.realm_access?.roles || [];
    const clientRoles = decodedToken.resource_access?.PFE?.roles || [];

    return [...realmRoles, ...clientRoles];
  }
}
