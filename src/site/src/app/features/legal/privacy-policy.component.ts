import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-privacy-policy',
  standalone: true,
  imports: [CommonModule],
  template: `
    <main id="main" class="legal-page">
      <div class="container">
        <div class="legal-content">
          <h1>Privacy Policy</h1>
          <p class="last-updated">Last Updated: January 9, 2026</p>

          <section>
            <h2>1. Introduction</h2>
            <p>Ventio ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how MoneyInsight, our personal finance management platform, handles your data.</p>
          </section>

          <section>
            <h2>2. Data We Never See</h2>
            <p><strong>Zero Server Storage:</strong> MoneyInsight processes all your financial data entirely in your browser using a Rust WASM engine. We never transmit, store, or have access to:</p>
            <ul>
              <li>Your bank statements</li>
              <li>Transaction details</li>
              <li>Account balances</li>
              <li>Any personally identifiable financial information</li>
            </ul>
            <p>Your financial data is stored exclusively in:</p>
            <ul>
              <li>Your browser's IndexedDB (local caching)</li>
              <li>Your own Google Drive (via Google Sheets)</li>
            </ul>
          </section>

          <section>
            <h2>3. Data We Collect</h2>
            <p>We only collect non-financial data necessary to provide our services:</p>
            <ul>
              <li><strong>Google Account Information:</strong> When you authenticate with Google OAuth, we receive your name, email, and profile picture for account identification.</li>
              <li><strong>Usage Analytics:</strong> We use Google Analytics to understand how users interact with our site (page views, clicks, navigation patterns). No financial data is included.</li>
              <li><strong>Form Submissions:</strong> When you contact us via our Google Form, we collect the information you voluntarily provide (name, email, message).</li>
            </ul>
          </section>

          <section>
            <h2>4. Google OAuth Scopes</h2>
            <p>MoneyInsight requests the following Google OAuth permissions:</p>
            <ul>
              <li><code>drive.file</code>: Limited access to create and manage only the Google Sheets files created by MoneyInsight. We cannot access any other files in your Drive.</li>
              <li><code>userinfo.email</code> and <code>userinfo.profile</code>: To identify your account.</li>
            </ul>
            <p>You can revoke these permissions at any time through your <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer">Google Account settings</a>.</p>
          </section>

          <section>
            <h2>5. Cookies</h2>
            <p>We use cookies for:</p>
            <ul>
              <li><strong>Essential Cookies:</strong> To maintain your session and theme preference (light/dark mode).</li>
              <li><strong>Analytics Cookies:</strong> Google Analytics cookies to understand site usage.</li>
            </ul>
            <p>You can disable cookies in your browser settings, but this may affect functionality.</p>
          </section>

          <section>
            <h2>6. Data Retention</h2>
            <p>Since we don't store your financial data, there's nothing for us to retain or delete. You control your data:</p>
            <ul>
              <li>Browser cache (IndexedDB): Cleared when you clear browser data</li>
              <li>Google Sheets: You own and control these files. Delete them anytime from your Google Drive.</li>
            </ul>
          </section>

          <section>
            <h2>7. Third-Party Services</h2>
            <p>We use the following third-party services:</p>
            <ul>
              <li><strong>Google OAuth & Google Sheets API:</strong> For authentication and data storage. Subject to Google's Privacy Policy.</li>
              <li><strong>Google Analytics:</strong> For site usage analytics. Subject to Google's Privacy Policy.</li>
              <li><strong>Google Forms:</strong> For contact form submissions. Subject to Google's Privacy Policy.</li>
            </ul>
          </section>

          <section>
            <h2>8. GDPR & Data Protection</h2>
            <p>For users in the EU/EEA:</p>
            <ul>
              <li><strong>Right to Access:</strong> You can access all your data in your browser and Google Sheets.</li>
              <li><strong>Right to Deletion:</strong> Clear your browser cache and delete the Google Sheets from your Drive.</li>
              <li><strong>Right to Portability:</strong> Export your Google Sheets data anytime.</li>
              <li><strong>Data Minimization:</strong> We collect only what's necessary (email, name for account identification).</li>
            </ul>
          </section>

          <section>
            <h2>9. Children's Privacy</h2>
            <p>MoneyInsight is not intended for users under 18. We do not knowingly collect data from children.</p>
          </section>

          <section>
            <h2>10. Changes to This Policy</h2>
            <p>We may update this policy occasionally. Changes will be posted on this page with an updated "Last Updated" date.</p>
          </section>

          <section>
            <h2>11. Contact Us</h2>
            <p>For privacy questions, contact us at: <a href="mailto:support@ventio.co.in">support&#64;ventio.co.in</a></p>
          </section>
        </div>
      </div>
    </main>
  `,
  styleUrl: './legal.component.scss'
})
export class PrivacyPolicyComponent {}
