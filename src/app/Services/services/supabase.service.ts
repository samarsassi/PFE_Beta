// supabase.service.ts
import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient('https://mtinyazosdancfweabhc.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10aW55YXpvc2RhbmNmd2VhYmhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4Mzc5ODcsImV4cCI6MjA2ODQxMzk4N30.UZ_GKWDNbGMRLvPTMajn4BXbQa4j1fP_B0XKkHyGeK8');
  }

  uploadFile(file: File): Promise<any> {
    const filePath = `cvs/${Date.now()}_${file.name}`;
    return this.supabase.storage.from('cvs').upload(filePath, file);
  }

  getPublicUrl(filePath: string): string {
    const { data } = this.supabase.storage.from('cvs').getPublicUrl(filePath);
    return data.publicUrl;
  }

  async uploadCvFile(file: File, candidatureTitle: string, offreTitle: string): Promise<string | null> {
    // Sanitize titles to make them file-safe
    const cleanCandidature = candidatureTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const cleanOffre = offreTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();

    const filePath = `${cleanCandidature}_${cleanOffre}_${Date.now()}_${file.name}`;

    const { error } = await this.supabase.storage.from('cvs').upload(filePath, file);
    if (error) {
      console.error('Upload error:', error.message);
      return null;
    }
    const { data } = this.supabase.storage.from('cvs').getPublicUrl(filePath);
    return data?.publicUrl || null;
  }


}
