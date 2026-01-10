import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface SiteContent {
  company: {
    name: string;
    tagline: string;
    email: string;
    domain: string;
  };
  navigation: {
    links: { label: string; route: string; }[];
  };
  footer: {
    socialLinks: { name: string; url: string; icon: string; }[];
    quickLinks: { label: string; route: string; }[];
    copyright: string;
  };
  home: {
    hero: {
      headline: string;
      subheadline: string;
      ctaPrimary: string;
      ctaSecondary: string;
    };
    benefits: {
      title: string;
      items: { icon: string; title: string; description: string; }[];
    };
    howItWorks: {
      title: string;
      steps: { number: number; title: string; description: string; }[];
    };
    supportedBanks: {
      title: string;
      banks: string[];
    };
  };
  product: {
    moneyInsightUrl: string;
    overview: string;
    features: { icon: string; title: string; description: string; }[];
    useCases: { title: string; description: string; }[];
    pricing: string;
  };
  about: {
    mission: string;
    vision: string;
    values: { title: string; description: string; }[];
  };
  contact: {
    title: string;
    subtitle: string;
    googleFormUrl: string;
    faq: { question: string; answer: string; }[];
  };
}

@Injectable({
  providedIn: 'root'
})
export class ContentService {
  private contentSubject = new BehaviorSubject<SiteContent>(this.getDefaultContent());
  public content$: Observable<SiteContent> = this.contentSubject.asObservable();

  constructor() {
    this.loadContent();
  }

  getContent(): SiteContent {
    return this.contentSubject.value;
  }

  updateContent(content: Partial<SiteContent>): void {
    const updated = { ...this.contentSubject.value, ...content };
    this.contentSubject.next(updated);
    this.saveContent(updated);
  }

  private loadContent(): void {
    const stored = localStorage.getItem('ventio-content');
    if (stored) {
      try {
        const content = JSON.parse(stored);
        this.contentSubject.next(content);
      } catch (e) {
        console.error('Failed to load content from storage', e);
      }
    }
  }

  private saveContent(content: SiteContent): void {
    localStorage.setItem('ventio-content', JSON.stringify(content));
  }

  private getDefaultContent(): SiteContent {
    return {
      company: {
        name: 'Ventio',
        tagline: 'Smart Financial Solutions, Online & Offline',
        email: 'ilaxi.prajapati@ventio.co.in',
        domain: 'ventio.co.in'
      },
      navigation: {
        links: [
          { label: 'Home', route: '/' },
          { label: 'Product', route: '/#/product' },
          { label: 'About', route: '/#/about' },
          { label: 'Contact', route: '/#/contact' }
        ]
      },
      footer: {
        socialLinks: [
          { name: 'LinkedIn', url: 'https://linkedin.com/company/ventio', icon: 'linkedin' },
          { name: 'Twitter', url: 'https://twitter.com/ventio', icon: 'twitter' },
          { name: 'GitHub', url: 'https://github.com/ventio', icon: 'github' }
        ],
        quickLinks: [
          { label: 'Home', route: '/' },
          { label: 'Product', route: '/#/product' },
          { label: 'About', route: '/#/about' },
          { label: 'Contact', route: '/#/contact' },
          { label: 'Privacy Policy', route: '/#/privacy' },
          { label: 'Terms', route: '/#/terms' }
        ],
        copyright: `© ${new Date().getFullYear()} Ventio. All rights reserved.`
      },
      home: {
        hero: {
          headline: 'Your Finances, Your Privacy, Your Control',
          subheadline: 'AI-powered personal finance management that never leaves your browser',
          ctaPrimary: 'Try MoneyInsight Free',
          ctaSecondary: 'Request Early Access'
        },
        benefits: {
          title: 'Why MoneyInsight?',
          items: [
            {
              icon: 'shield',
              title: 'Privacy-First',
              description: 'All data processing happens in your browser. Zero server storage of your financial data.'
            },
            {
              icon: 'cpu',
              title: 'AI-Powered',
              description: 'Intelligent transaction categorization with machine learning that improves as you use it.'
            },
            {
              icon: 'cloud-off',
              title: 'Offline-First',
              description: 'Works without internet. Your data is cached locally and syncs when you\'re ready.'
            }
          ]
        },
        howItWorks: {
          title: 'How It Works',
          steps: [
            { number: 1, title: 'Upload Bank Statement', description: 'Drag and drop your Excel or CSV file' },
            { number: 2, title: 'AI Categorizes Transactions', description: 'Our ML engine auto-tags every transaction' },
            { number: 3, title: 'Review & Correct', description: 'Check and adjust categories on your dashboard' },
            { number: 4, title: 'Data Syncs to Google Sheets', description: 'Everything saves to your own Google Drive' }
          ]
        },
        supportedBanks: {
          title: 'Supported Formats (XLSX/XLS)',
          banks: ['HDFC Saving Account', 'HDFC Credit Card', 'SBI Saving Account', 'More coming soon...']
        }
      },
      product: {
        moneyInsightUrl: 'https://moneyinsight.ventio.co.in',
        overview: 'MoneyInsight is a privacy-first personal finance platform that helps you track expenses, analyze spending patterns, and make informed financial decisions—all without sharing your data with any server.',
        features: [
          {
            icon: 'upload',
            title: 'Smart Import',
            description: 'Upload Excel or CSV statements from HDFC, SBI, ICICI, and more. Automatic format detection.'
          },
          {
            icon: 'tag',
            title: 'AI Categorization',
            description: 'ML-powered transaction tagging with confidence indicators. Learns from your corrections.'
          },
          {
            icon: 'bar-chart',
            title: 'Visual Dashboard',
            description: 'Net flow, income vs expense, category breakdown, and trend analysis at a glance.'
          },
          {
            icon: 'lock',
            title: 'Privacy Guaranteed',
            description: 'Rust WASM engine processes everything client-side. Zero server access to your financial data.'
          },
          {
            icon: 'cloud',
            title: 'Google Sheets Sync',
            description: 'Seamlessly sync to your own Google Drive. You own and control all your data.'
          },
          {
            icon: 'wifi-off',
            title: 'Offline Access',
            description: 'IndexedDB caching enables instant access even without internet connection.'
          }
        ],
        useCases: [
          { title: 'Track Monthly Expenses', description: 'See where your money goes every month with detailed breakdowns' },
          { title: 'Prepare Tax Returns', description: 'Export categorized transactions for easy tax filing' },
          { title: 'Analyze Spending Patterns', description: 'Identify trends and make informed budget decisions' },
          { title: 'Budget Planning', description: 'Set spending goals and track progress against them' }
        ],
        pricing: 'Free during beta. Future pricing tiers to be announced.'
      },
      about: {
        mission: 'Empowering financial independence through privacy-first technology',
        vision: 'We envision a world where managing personal finances is effortless, secure, and completely under user control. No compromises on privacy, no hidden agendas.',
        values: [
          { title: 'Privacy', description: 'Your data belongs to you, not on our servers' },
          { title: 'Transparency', description: 'Open about how we work and what we do with your data (nothing!)' },
          { title: 'Innovation', description: 'Leveraging cutting-edge tech like Rust WASM and AI for better UX' },
          { title: 'User-Centricity', description: 'Built for real people with real financial challenges' }
        ]
      },
      contact: {
        title: 'Get in Touch',
        subtitle: 'Have questions? Want early access? We\'d love to hear from you.',
        googleFormUrl: 'https://docs.google.com/forms/d/e/1FAIpQLSfrNCYGLlNFy1JsEYrJZB6HWpFhfnz-zaw1Yi86aD5CsX7lmg/viewform',
        faq: [
          {
            question: 'Is my data safe?',
            answer: 'Absolutely. All processing happens in your browser using a Rust WASM engine. We never see or store your financial data on our servers.'
          },
          {
            question: 'Which banks are supported?',
            answer: 'Currently we support HDFC, SBI, ICICI, Axis, and Kotak. We\'re adding more banks regularly through our plugin architecture.'
          },
          {
            question: 'Do I need to install anything?',
            answer: 'No installation required! MoneyInsight runs entirely in your web browser.'
          },
          {
            question: 'What happens to my Google Sheets data?',
            answer: 'The data is stored in YOUR Google Drive, in a sheet you own. You can export, delete, or modify it anytime.'
          },
          {
            question: 'Is this really free?',
            answer: 'Yes, during the beta period. We may introduce premium features later, but core functionality will remain free.'
          }
        ]
      }
    };
  }
}
