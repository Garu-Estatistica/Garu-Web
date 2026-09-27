import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type CustomDatasetRecord = Record<string, string | number | null>;

interface CustomLabState {
  customDataset: CustomDatasetRecord[] | null;
  fileName: string | null;
  numericColumns: string[];
  factorColumns: string[];
  allColumns: string[];
  idColumn: string | null;
  hasIdColumn: boolean;
  setCustomDataset: (
    data: CustomDatasetRecord[],
    name: string,
    numeric: string[],
    factor: string[],
    allCols: string[],
    idColumn?: string | null,
    hasIdColumn?: boolean,
  ) => void;
  clearCustomDataset: () => void;
}

export const useCustomLabStore = create<CustomLabState>()(
  persist(
    (set) => ({
      customDataset: null,
      fileName: null,
      numericColumns: [],
      factorColumns: [],
      allColumns: [],
      idColumn: null,
      hasIdColumn: false,
      setCustomDataset: (data, name, numeric, factor, allCols, idColumn = null, hasIdColumn = false) =>
        set({
          customDataset: data,
          fileName: name,
          numericColumns: numeric,
          factorColumns: factor,
          allColumns: allCols,
          idColumn,
          hasIdColumn,
        }),
      clearCustomDataset: () =>
        set({
          customDataset: null,
          fileName: null,
          numericColumns: [],
          factorColumns: [],
          allColumns: [],
          idColumn: null,
          hasIdColumn: false,
        }),
    }),
    {
      name: 'garu-custom-lab-storage',
    }
  )
);
