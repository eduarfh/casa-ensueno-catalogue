// lib/db-helpers.ts
import { query, getClient } from './db';

export interface QueryBuilder {
  select(columns: string): QueryBuilder;
  from(table: string): QueryBuilder;
  where(column: string, operator: string, value: any): QueryBuilder;
  eq(column: string, value: any): QueryBuilder;
  order(column: string, options?: { ascending?: boolean }): QueryBuilder;
  limit(count: number): QueryBuilder;
  single(): Promise<{ data: any; error: any }>;
  maybeSingle(): Promise<{ data: any; error: any }>;
  execute(): Promise<{ data: any[]; error: any }>;
}

class PostgresQueryBuilder implements QueryBuilder {
  private _select: string = '*';
  private _from: string = '';
  private _where: string[] = [];
  private _order: string = '';
  private _limit: number | null = null;
  private _params: any[] = [];
  private _paramCount: number = 0;

  select(columns: string): QueryBuilder {
    this._select = columns;
    return this;
  }

  from(table: string): QueryBuilder {
    this._from = table;
    return this;
  }

  where(column: string, operator: string, value: any): QueryBuilder {
    this._paramCount++;
    this._params.push(value);
    this._where.push(`${column} ${operator} $${this._paramCount}`);
    return this;
  }

  eq(column: string, value: any): QueryBuilder {
    return this.where(column, '=', value);
  }

  order(column: string, options?: { ascending?: boolean }): QueryBuilder {
    const direction = options?.ascending === false ? 'DESC' : 'ASC';
    this._order = `ORDER BY ${column} ${direction}`;
    return this;
  }

  limit(count: number): QueryBuilder {
    this._limit = count;
    return this;
  }

  private buildQuery(): string {
    let sql = `SELECT ${this._select} FROM ${this._from}`;
    
    if (this._where.length > 0) {
      sql += ` WHERE ${this._where.join(' AND ')}`;
    }
    
    if (this._order) {
      sql += ` ${this._order}`;
    }
    
    if (this._limit !== null) {
      sql += ` LIMIT ${this._limit}`;
    }
    
    return sql;
  }

  async single(): Promise<{ data: any; error: any }> {
    try {
      this._limit = 1;
      const sql = this.buildQuery();
      const result = await query(sql, this._params);
      
      if (result.rows.length === 0) {
        return { data: null, error: { message: 'No rows found' } };
      }
      
      return { data: result.rows[0], error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async maybeSingle(): Promise<{ data: any; error: any }> {
    try {
      this._limit = 1;
      const sql = this.buildQuery();
      const result = await query(sql, this._params);
      
      return { data: result.rows[0] || null, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async execute(): Promise<{ data: any[]; error: any }> {
    try {
      const sql = this.buildQuery();
      const result = await query(sql, this._params);
      return { data: result.rows, error: null };
    } catch (error) {
      return { data: [], error };
    }
  }
}

export function createQueryBuilder(): QueryBuilder {
  return new PostgresQueryBuilder();
}

// Helper para INSERT
export async function insert(table: string, data: any) {
  const keys = Object.keys(data);
  const values = Object.values(data);
  const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
  const columns = keys.join(', ');
  
  const sql = `INSERT INTO ${table} (${columns}) VALUES (${placeholders}) RETURNING *`;
  
  try {
    const result = await query(sql, values);
    return { data: result.rows[0], error: null };
  } catch (error) {
    return { data: null, error };
  }
}

// Helper para UPDATE
export async function update(table: string, data: any, whereColumn: string, whereValue: any) {
  const keys = Object.keys(data);
  const values = Object.values(data);
  
  const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');
  const sql = `UPDATE ${table} SET ${setClause} WHERE ${whereColumn} = $${keys.length + 1} RETURNING *`;
  
  try {
    const result = await query(sql, [...values, whereValue]);
    return { data: result.rows[0], error: null };
  } catch (error) {
    return { data: null, error };
  }
}

// Helper para DELETE
export async function deleteFrom(table: string, whereColumn: string, whereValue: any) {
  const sql = `DELETE FROM ${table} WHERE ${whereColumn} = $1 RETURNING *`;
  
  try {
    const result = await query(sql, [whereValue]);
    return { data: result.rows[0], error: null };
  } catch (error) {
    return { data: null, error };
  }
}
