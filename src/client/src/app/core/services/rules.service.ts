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
