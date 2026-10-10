import Papa from 'papaparse';
import type { CustomDatasetRecord } from '../stores/useCustomLabStore';

export type ColumnType = 'numeric' | 'categorical';

export interface ParsedResult {
  data: CustomDatasetRecord[];
  numericColumns: string[];
  factorColumns: string[];
  allColumns: string[];
  columnTypes: Record<string, ColumnType>;
}

const isMissingValue = (value: string | null | undefined): boolean => {
  if (value === null || value === undefined) return true;
  const normalized = value.trim();
  return normalized === '' || ['NA', 'N/A', 'NULL', 'NaN'].includes(normalized.toUpperCase());
};

const parseNumericLiteral = (value: string, columnName: string): number => {
  const normalized = value.trim();

  if (normalized === '' || normalized.toUpperCase() === 'NA') {
    throw new Error(`A coluna "${columnName}" contém valores ausentes incompatíveis para análise numérica.`);
  }

  if (normalized.includes(',')) {
    throw new Error(`A coluna "${columnName}" usa separador decimal com vírgula. Use ponto como separador decimal (ex.: 1.75).`);
  }

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) {
    throw new Error(`A coluna "${columnName}" contém valores incompatíveis para o tipo numérico.`);
  }

  return parsed;
};

export function applyColumnTypeOverrides(
  allColumns: string[],
  numericColumns: string[],
  overrides: Record<string, ColumnType> = {},
  idColumn: string | null = null,
) {
  const numericSet = new Set(numericColumns);

  const finalNumeric = new Set<string>();
  const finalFactor = new Set<string>();

  allColumns.forEach((column) => {
    if (idColumn && column === idColumn) {
      return;
    }

    const resolvedType = overrides[column] ?? (numericSet.has(column) ? 'numeric' : 'categorical');
    if (resolvedType === 'numeric') {
      finalNumeric.add(column);
    } else {
      finalFactor.add(column);
    }
  });

  const analysisNumericColumns = [...finalNumeric];
  const analysisFactorColumns = [...finalFactor];

  if (!idColumn) {
    // keep current arrays if user selected no ID column
    return {
      numericColumns: [...finalNumeric],
      factorColumns: [...finalFactor],
      analysisNumericColumns,
      analysisFactorColumns,
      idColumn: null,
    };
  }

  return {
    numericColumns: [...finalNumeric],
    factorColumns: [...finalFactor],
    analysisNumericColumns,
    analysisFactorColumns,
    idColumn,
  };
}

export function buildReviewedDataset(
  rawRows: Array<Record<string, string | null | undefined>>,
  columns: string[],
  columnTypes: Record<string, ColumnType>,
): CustomDatasetRecord[] {
  return rawRows.map((row) => {
    const normalizedRow: CustomDatasetRecord = {};

    columns.forEach((column) => {
      const rawValue = row[column];

      if (isMissingValue(rawValue)) {
        normalizedRow[column] = null;
        return;
      }

      const value = String(rawValue).trim();
      if (columnTypes[column] === 'numeric') {
        normalizedRow[column] = parseNumericLiteral(value, column);
      } else {
        normalizedRow[column] = value;
      }
    });

    return normalizedRow;
  });
}

export function parseCsvText(csvText: string): ParsedResult {
  const parsed = Papa.parse<Record<string, string | null | undefined>>(csvText, {
    header: true,
    skipEmptyLines: true,
    transform: (value) => value,
  });

  if (parsed.errors.length > 0) {
    const firstError = parsed.errors[0];
    if (firstError.code === 'TooFewFields' || firstError.code === 'TooManyFields') {
      throw new Error('O arquivo CSV parece estar com colunas inconsistentes. Verifique se os valores decimais usam ponto e se o cabeçalho está correto.');
    }
  }

  const rawData = parsed.data as Array<Record<string, string | null | undefined>>;

  if (!rawData || rawData.length === 0) {
    throw new Error('O arquivo está vazio ou sem dados válidos para importar.');
  }

  const fields = parsed.meta.fields?.filter((field) => field && field.trim() !== '');
  if (!fields || fields.length === 0) {
    throw new Error('CSV sem cabeçalho. Adicione a primeira linha com os nomes das variáveis.');
  }

  const rowsWithExtraFields = rawData.some((row) => Object.prototype.hasOwnProperty.call(row, '__parsed_extra'));
  if (rowsWithExtraFields) {
    throw new Error('O arquivo contém colunas inconsistentes. Verifique o uso do ponto como separador decimal e a quantidade de colunas em cada linha.');
  }

  const columnTypes: Record<string, ColumnType> = {};
  const numericColumns: string[] = [];
  const factorColumns: string[] = [];

  fields.forEach((column) => {
    let hasValidValue = false;
    let isNumeric = true;

    for (const row of rawData) {
      const rawValue = row[column];
      if (isMissingValue(rawValue)) {
        continue;
      }

      hasValidValue = true;
      try {
        parseNumericLiteral(String(rawValue), column);
      } catch {
        isNumeric = false;
        break;
      }
    }

    columnTypes[column] = hasValidValue && isNumeric ? 'numeric' : 'categorical';
    if (columnTypes[column] === 'numeric') {
      numericColumns.push(column);
    } else {
      factorColumns.push(column);
    }
  });

  const data = buildReviewedDataset(rawData, fields, columnTypes);

  return {
    data,
    numericColumns,
    factorColumns,
    allColumns: fields,
    columnTypes,
  };
}

export async function parseCustomCSV(file: File): Promise<ParsedResult> {
  const csvText = await file.text();
  return parseCsvText(csvText);
}
