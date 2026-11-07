// client/src/components/dashboard/RecentTransactions.tsx

// Recent transactions list widget presenting quick-glance transaction activity and category badges.

'use client';

import * as React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { PopulatedAccount, PopulatedCategory, Transaction } from '@/types';
import { ArrowDownLeft, ArrowRightLeft, ArrowUpRight, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface RecentTransactionsProps {
  transactions: Transaction[];
  currency: string;
}

export function RecentTransactions({ transactions, currency }: RecentTransactionsProps) {
  return (
    <Card className="flex flex-col justify-between">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-fg">Recent Activity</h3>
          <p className="text-xs text-fg-muted">Your latest recorded financial transactions</p>
        </div>
        <Link
          href="/transactions"
          className="focus-ring flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400"
        >
          <span>View all</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {transactions && transactions.length > 0 ? (
        <div className="divide-y divide-border-subtle">
          {transactions.map((tx) => {
            const isIncome = tx.type === 'income';
            const isExpense = tx.type === 'expense';
            const isTransfer = tx.type === 'transfer';

            const category = tx.categoryId as PopulatedCategory | undefined;
            const account = tx.accountId as PopulatedAccount | undefined;
            const destAccount = tx.destinationAccountId as PopulatedAccount | undefined;

            return (
              <div
                key={tx.id || tx._id}
                className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                      isIncome
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                        : isExpense
                          ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
                          : 'bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400'
                    }`}
                  >
                    {isIncome && <ArrowDownLeft className="h-4 w-4" />}
                    {isExpense && <ArrowUpRight className="h-4 w-4" />}
                    {isTransfer && <ArrowRightLeft className="h-4 w-4" />}
                  </span>

                  <div>
                    <p className="text-sm font-medium text-fg">{tx.description}</p>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-fg-muted">
                      <span>{formatDate(tx.date)}</span>
                      <span>•</span>
                      {isTransfer ? (
                        <span>
                          {account?.name || 'Account'} → {destAccount?.name || 'Account'}
                        </span>
                      ) : (
                        <span>{account?.name || 'Account'}</span>
                      )}
                      {category && (
                        <>
                          <span>•</span>
                          <Badge variant="neutral" className="text-[10px] py-0 px-1.5">
                            {category.name}
                          </Badge>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`text-sm font-semibold ${
                      isIncome
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : isExpense
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-fg'
                    }`}
                  >
                    {isIncome && '+'}
                    {isExpense && '-'}
                    {formatCurrency(tx.convertedAmount ?? tx.amount, currency)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-8 text-center text-xs text-fg-muted">No transactions recorded yet.</div>
      )}
    </Card>
  );
}
