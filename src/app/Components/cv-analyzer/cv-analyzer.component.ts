import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { OffreEmploiService } from 'src/app/Services/fn/offreemploi/OffreEmploiService';
import { StatsService } from 'src/app/Services/fn/stats/stats.service';
import { KeycloakService } from 'src/app/Services/keycloak/keycloak.service';
import { environment } from 'src/environments/environment';

interface ChatMessage {
  sender: 'user' | 'ai';
  content: string;
  isOffers?: boolean;           // optional flag to mark offer messages
  offers?: {                    // optional offers array
    title: string;
    shortDescription: string;
    fullOffer: any;
  }[];
}

@Component({
  selector: 'app-cv-analyzer',
  templateUrl: './cv-analyzer.component.html',
  styleUrls: ['./cv-analyzer.component.css']
})
export class CvAnalyzerComponent implements OnInit {

  messages: ChatMessage[] = [];
  inputMessage: string = '';
  loading: boolean = false;
  showChat: boolean = false;

  constructor(
    private http: HttpClient,
    private keycloakService: KeycloakService,
    private offerService: OffreEmploiService,
    private statsService: StatsService,
    private router: Router
  ) {}

  ngOnInit() {}

  extractSearchQuery(input: string): string[] | null {
    const stopWords = ['i', 'am', 'the', 'is', 'in', 'on', 'for', 'to', 'of', 'and', 'with', 'at', 'want', 'need', 'looking', 'searching', 'find', 'give', 'me', 'jobs'];
  
    const synonyms: Record<string, string[]> = {
      developer: ['dev', 'software engineer', 'programmer', 'engineer', 'software'],
      designer: ['ux', 'ui', 'ux/ui', 'ux designer', 'ui designer'],
      marketing: ['seo', 'growth', 'digital marketing'],
    };
  
    const lower = input.toLowerCase().replace(/[^\w\s]/g, '');
    let words = lower.split(/\s+/).filter(w => !stopWords.includes(w));
  
    const expanded = new Set<string>();
    for (const word of words) {
      expanded.add(word);
      Object.entries(synonyms).forEach(([key, values]) => {
        if (word === key || values.includes(word)) {
          expanded.add(key);
          values.forEach(v => expanded.add(v));
        }
      });
    }
  
    return expanded.size === 0 ? null : Array.from(expanded);
  }
  
  // Returns a Promise that resolves with offers or empty array
  searchOffersByKeywords(keywords: string[]): Promise<any[]> {
    return new Promise((resolve) => {
      this.loading = true;
      const allResults: any[] = [];
      let completedRequests = 0;
  
      keywords.forEach(keyword => {
        this.offerService.getOffersByKeyword(keyword).subscribe({
          next: offers => {
            allResults.push(...offers);
            completedRequests++;
            if (completedRequests === keywords.length) {
              const uniqueResults = this.removeDuplicates(allResults);
              this.loading = false;
              resolve(uniqueResults);
            }
          },
          error: err => {
            console.error(err);
            completedRequests++;
            if (completedRequests === keywords.length) {
              this.loading = false;
              resolve(this.removeDuplicates(allResults));
            }
          }
        });
      });
  
      if (keywords.length === 0) {
        this.loading = false;
        resolve([]);
      }
    });
  }
  

  removeDuplicates(results: any[]): any[] {
    const map = new Map();
    results.forEach(item => {
      if (!map.has(item.id)) {
        map.set(item.id, item);
      }
    });
    return Array.from(map.values());
  }

  
  async sendMessage() {
    if (!this.inputMessage.trim()) return;

    const userMessage = this.inputMessage.trim();
    this.messages.push({ sender: 'user', content: userMessage });
    this.inputMessage = '';
    this.loading = true;

    if (this.hasAdminRole() && this.isStatsRequest(userMessage)) {
      this.statsService.getStats().subscribe({
        next: (stats) => {
          const statsMessage = 
          `📈 **Current Stats:**\n` +
          `🔖 Offers: ${stats.offers}\n` +
          `📝 Candidatures: ${stats.candidatures}\n` +
          `🏆 Challenges: ${stats.challenges}`;

          this.messages.push({ sender: 'ai', content: statsMessage });
          this.loading = false;
        },
        error: (err) => {
          this.messages.push({ sender: 'ai', content: '⚠️ Failed to retrieve stats.' });
          this.loading = false;
        }
      });
    } else {
      // your existing code for offers and AI chat...
      const offers = await this.handleUserInput(userMessage);

      this.http.post(`${environment.apiUrl}/api/ai/chat`, userMessage, { responseType: 'text' })
        .subscribe({
          next: res => {
            if (offers && offers.length > 0) {
              const offersWithShortDesc = offers.map(o => ({
                ...o,
                shortDescription: o.description ? o.description.split('. ')[0].slice(0, 100) + (o.description.length > 100 ? '...' : '') : ''
              }));
              this.messages.push({
                sender: 'ai',
                content: `🎯 Here are some offers matching your request:\n\n`,
                isOffers: true,
                offers: offersWithShortDesc
              });
            } else {
              this.messages.push({ sender: 'ai', content: res });
            }
            this.loading = false;
          },
          error: err => {
            console.error(err);
            this.messages.push({ sender: 'ai', content: '⚠️ Something went wrong. Please try again.' });
            this.loading = false;
          }
        });
    }
  }

  isStatsRequest(message: string): boolean {
    const statsKeywords = ['stats', 'statistics', 'offers', 'candidatures', 'challenges','statistiques'];
    const lower = message.toLowerCase();
    return statsKeywords.some(keyword => lower.includes(keyword));
  }
  
  
  async handleUserInput(message: string): Promise<any[] | null> {
    const keywords = this.extractSearchQuery(message);
    if (keywords && keywords.length > 0) {
      return await this.searchOffersByKeywords(keywords);
    }
    return null;
  }

  

  handleKey(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.handleSend();
    }
  }

  handleSend() {
    this.sendMessage();
  }
  

  hasAdminRole(): boolean {
    const userRoles = this.keycloakService.keycloak?.tokenParsed?.resource_access?.['PFE']?.roles || [];
    return userRoles.includes('admin');
  }

  openOfferDetails(offer: any) {
    console.log(offer.id)
    this.router.navigate(['/main/offre', offer.id]);
  }
}
