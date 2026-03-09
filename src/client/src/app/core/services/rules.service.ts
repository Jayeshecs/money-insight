import { Injectable, inject } from '@angular/core';
import { IndexedDbService } from './indexeddb.service';
import { Rule, Transaction } from '../models/data-models';

@Injectable({ providedIn: 'root' })
export class RulesService {
  private idb = inject(IndexedDbService);

  async saveRule(keyword: string, category: string): Promise<void> {
    const allRules = await this.idb.getAllRules();
    const existing = allRules.find(r => r.pattern === keyword);
    const now = new Date().toISOString();

    if (existing) {
      const updated: Rule = {
        ...existing,
        category,
        lastModified: now,
        synced: false,
      };
      await this.idb.updateRule(updated);
    } else {
      const newRule: Rule = {
        id: crypto.randomUUID(),
        patternType: 'CONTAINS',
        pattern: keyword,
        category,
        subCategory: null,
        priority: 50,
        active: true,
        source: 'USER_FEEDBACK',
        feedback: true,
        createdAt: now,
        lastModified: now,
        synced: false,
      };
      await this.idb.addRule(newRule);
    }
  }

  async getRules(): Promise<Rule[]> {
    return this.idb.getActiveRules();
  }

  /** Alias for getRules() — returns only active rules from IDB. */
  async getActiveRules(): Promise<Rule[]> {
    return this.idb.getActiveRules();
  }

  /**
   * Re-applies the current active rule set to all IDB transactions where
   * `source !== 'USER_FEEDBACK'` (i.e., AI-assigned categories only).
   * Writes back ONLY changed records to IDB.
   * Does NOT change the `synced` flag — no secondary Sheets sync is triggered.
   *
   * @returns count of transactions whose category was updated
   */
  async reApplyRulesToAllTransactions(): Promise<number> {
    const allTxns = await this.idb.getAllTransactions();
    // Only re-apply to transactions not manually corrected by the user
    const eligible = allTxns.filter(t => t.source !== 'USER_FEEDBACK');
    if (eligible.length === 0) return 0;

    const ruleApplied = await this.applyRulesToTransactions(eligible);
    let count = 0;
    const now = new Date().toISOString();

    for (let i = 0; i < eligible.length; i++) {
      if (eligible[i].category !== ruleApplied[i].category) {
        // Write back with updated category and lastModified; synced flag unchanged
        await this.idb.updateTransaction({
          ...ruleApplied[i],
          lastModified: now,
        });
        count++;
      }
    }
    return count;
  }

  async applyRulesToTransactions(txns: Transaction[]): Promise<Transaction[]> {
    const rules = await this.getRules();
    if (rules.length === 0) return txns;

    // Sort by priority descending (higher priority = applied last = wins)
    const sorted = [...rules].sort((a, b) => a.priority - b.priority);

    return txns.map(txn => {
      const narrationLower = txn.narration.toLowerCase();
      let matched: Rule | undefined;
      for (const rule of sorted) {
        if (rule.patternType === 'CONTAINS' && narrationLower.includes(rule.pattern.toLowerCase())) {
          matched = rule;
        } else if (rule.patternType === 'EXACT' && narrationLower === rule.pattern.toLowerCase()) {
          matched = rule;
        }
      }
      if (matched) {
        return { ...txn, category: matched.category };
      }
      return txn;
    });
  }
}
