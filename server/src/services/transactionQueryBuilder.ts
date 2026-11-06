// server/src/services/transactionQueryBuilder.ts

// Builds MongoDB query filters and sort criteria for paginated transaction search.

import { Types } from 'mongoose';
import { ITransaction } from '../models/Transaction.js';
import { TransactionQueryParams } from '../schemas/transactionSchemas.js';

export interface PaginatedTransactions {
  transactions: ITransaction[];
  pagination: {
    totalCount: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface BuiltTransactionQuery {
  filter: Record<string, unknown>;
  sort: Record<string, 1 | -1>;
  skip: number;
  limit: number;
  page: number;
}

export function buildTransactionQuery(
  userId: string,
  query: TransactionQueryParams
): BuiltTransactionQuery {
  const userObjectId = new Types.ObjectId(userId);
  const filter: Record<string, unknown> = { userId: userObjectId };

  // Search by description or vendor
  if (query.search && query.search.trim().length > 0) {
    const searchRegex = { $regex: query.search.trim(), $options: 'i' };
    filter.$or = [{ description: searchRegex }, { vendor: searchRegex }];
  }

  // Filter by transaction type
  if (query.type) {
    filter.type = query.type;
  }

  // Filter by account (matches either source or destination wallet)
  if (query.accountId) {
    const accountObjectId = new Types.ObjectId(query.accountId);
    filter.$or = [{ accountId: accountObjectId }, { destinationAccountId: accountObjectId }];
  }

  // Filter by category
  if (query.categoryId) {
    filter.categoryId = new Types.ObjectId(query.categoryId);
  }

  // Date range filter
  if (query.startDate || query.endDate) {
    const dateFilter: Record<string, Date> = {};
    if (query.startDate) {
      dateFilter.$gte = new Date(query.startDate);
    }
    if (query.endDate) {
      const endDate = new Date(query.endDate);
      if (query.endDate.length === 10) {
        endDate.setHours(23, 59, 59, 999);
      }
      dateFilter.$lte = endDate;
    }
    filter.date = dateFilter;
  }

  const page = query.page || 1;
  const limit = query.limit || 20;
  const skip = (page - 1) * limit;

  const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
  const sortField = query.sortBy || 'date';
  const sort: Record<string, 1 | -1> = { [sortField]: sortOrder };

  return { filter, sort, skip, limit, page };
}
