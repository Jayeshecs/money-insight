import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-terms',
  standalone: true,
  imports: [CommonModule],
  template: `
    <main id="main" class="legal-page">
      <div class="container">
        <div class="legal-content">
          <h1>Terms of Service</h1>
          <p class="last-updated">Last Updated: January 9, 2026</p>

          <section>
            <h2>1. Acceptance of Terms</h2>
            <p>By accessing or using MoneyInsight ("the Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not use the Service.</p>
          </section>

          <section>
            <h2>2. Description of Service</h2>
            <p>MoneyInsight is a privacy-first personal finance management platform that:</p>
            <ul>
              <li>Processes bank statements entirely in your browser using WebAssembly</li>
              <li>Categorizes transactions using machine learning</li>
              <li>Stores data in your own Google Drive (Google Sheets)</li>
              <li>Provides financial analytics and visualizations</li>
            </ul>
          </section>

          <section>
            <h2>3. Beta Program</h2>
            <p>MoneyInsight is currently in beta. The Service is provided "as is" without warranties. Features may change, and bugs may exist. By using the beta:</p>
            <ul>
              <li>You acknowledge the Service is under active development</li>
              <li>You agree to provide feedback to help improve the platform</li>
              <li>You understand that access may be terminated or modified at any time</li>
            </ul>
          </section>

          <section>
            <h2>4. User Responsibilities</h2>
            <p>You are responsible for:</p>
            <ul>
              <li>Maintaining the confidentiality of your Google account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Ensuring uploaded files are not password-protected or encrypted</li>
              <li>Verifying the accuracy of AI-categorized transactions</li>
              <li>Backing up your data (though it's stored in your Google Drive)</li>
            </ul>
          </section>

          <section>
            <h2>5. Prohibited Uses</h2>
            <p>You may not:</p>
            <ul>
              <li>Attempt to reverse engineer, decompile, or disassemble the Service</li>
              <li>Use the Service for illegal or unauthorized purposes</li>
              <li>Upload malicious files or attempt to compromise the Service</li>
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe on intellectual property rights</li>
            </ul>
          </section>

          <section>
            <h2>6. Privacy & Data Ownership</h2>
            <p>Your data belongs to you:</p>
            <ul>
              <li>We do not store your financial data on our servers</li>
              <li>All processing happens client-side in your browser</li>
              <li>Data is stored in YOUR Google Drive, which you fully control</li>
              <li>You can delete your data at any time by removing the Google Sheets from your Drive</li>
            </ul>
            <p>See our <a routerLink="/privacy">Privacy Policy</a> for details.</p>
          </section>

          <section>
            <h2>7. Intellectual Property</h2>
            <p>The Service, including its WASM engine, UI, and branding, is owned by Ventio. You may not:</p>
            <ul>
              <li>Copy, modify, or distribute our code or designs</li>
              <li>Use our trademarks without permission</li>
              <li>Create derivative works without authorization</li>
            </ul>
          </section>

          <section>
            <h2>8. Disclaimer of Warranties</h2>
            <p>THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO:</p>
            <ul>
              <li>Accuracy of AI categorizations</li>
              <li>Uninterrupted or error-free operation</li>
              <li>Fitness for a particular purpose</li>
              <li>Non-infringement</li>
            </ul>
            <p><strong>Important:</strong> MoneyInsight is a tool to assist with personal finance management. It is not financial advice. Always verify categorizations and consult with a financial advisor for investment decisions.</p>
          </section>

          <section>
            <h2>9. Limitation of Liability</h2>
            <p>To the maximum extent permitted by law, Ventio shall not be liable for:</p>
            <ul>
              <li>Indirect, incidental, or consequential damages</li>
              <li>Loss of data, profits, or business opportunities</li>
              <li>Errors in AI categorization leading to financial decisions</li>
              <li>Issues arising from third-party services (Google OAuth, Google Sheets)</li>
            </ul>
            <p>Our total liability shall not exceed the amount you paid us in the past 12 months (currently $0 during beta).</p>
          </section>

          <section>
            <h2>10. Indemnification</h2>
            <p>You agree to indemnify and hold Ventio harmless from any claims, damages, or expenses arising from:</p>
            <ul>
              <li>Your use of the Service</li>
              <li>Your violation of these Terms</li>
              <li>Your violation of any third-party rights</li>
            </ul>
          </section>

          <section>
            <h2>11. Third-Party Services</h2>
            <p>The Service relies on:</p>
            <ul>
              <li><strong>Google OAuth:</strong> For authentication</li>
              <li><strong>Google Sheets API:</strong> For data storage</li>
            </ul>
            <p>Your use of these services is subject to Google's Terms of Service and Privacy Policy. We are not responsible for Google's actions or policies.</p>
          </section>

          <section>
            <h2>12. Termination</h2>
            <p>We may terminate or suspend your access to the Service at any time for:</p>
            <ul>
              <li>Violation of these Terms</li>
              <li>Suspected fraudulent or illegal activity</li>
              <li>End of beta program</li>
            </ul>
            <p>You may stop using the Service at any time. Upon termination, you retain ownership of your data in Google Sheets.</p>
          </section>

          <section>
            <h2>13. Changes to Terms</h2>
            <p>We reserve the right to modify these Terms at any time. Changes will be posted on this page with an updated date. Continued use of the Service after changes constitutes acceptance.</p>
          </section>

          <section>
            <h2>14. Governing Law</h2>
            <p>These Terms are governed by the laws of India. Disputes shall be resolved in the courts of [Your Jurisdiction].</p>
          </section>

          <section>
            <h2>15. Contact</h2>
            <p>For questions about these Terms, contact us at: <a href="mailto:support@ventio.co.in">support&#64;ventio.co.in</a></p>
          </section>
        </div>
      </div>
    </main>
  `,
  styleUrl: './legal.component.scss'
})
export class TermsComponent {}
