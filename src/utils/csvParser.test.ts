import { describe, it, expect } from 'vitest';
import { applyColumnTypeOverrides, parseCustomCSV } from './csvParser';

describe('csvParser', () => {
  it('reads valid CSV headers and decimal values using dot', async () => {
    const file = new File([
      'id,idade,sexo\n',
      '1,20.5,Feminino\n',
      '2,22.0,Masculino\n'
    ], 'dados.csv', { type: 'text/csv' });

    const result = await parseCustomCSV(file);

    expect(result.allColumns).toEqual(['id', 'idade', 'sexo']);
    expect(result.numericColumns).toEqual(['id', 'idade']);
    expect(result.factorColumns).toEqual(['sexo']);
    expect(result.data[0]).toMatchObject({ id: 1, idade: 20.5, sexo: 'Feminino' });
  });

  it('rejects comma decimals because the project expects point as separator', async () => {
    const file = new File([
      'id,idade\n',
      '1,20,5\n',
      '2,22,0\n'
    ], 'csv-com-virgula.csv', { type: 'text/csv' });

    await expect(parseCustomCSV(file)).rejects.toThrow(/ponto|decimal/i);
  });

  it('keeps blank and NA values as missing values', async () => {
    const file = new File([
      'id,idade,sexo\n',
      '1,20.5,Feminino\n',
      '2,NA,\n',
      '3,,Masculino\n'
    ], 'dados_na.csv', { type: 'text/csv' });

    const result = await parseCustomCSV(file);

    expect(result.data[1].idade).toBeNull();
    expect(result.data[1].sexo).toBeNull();
    expect(result.data[2].idade).toBeNull();
  });

  it('allows user review to convert a numeric-coded column into categorical', () => {
    const result = applyColumnTypeOverrides(
      ['id', 'sexo', 'idade'],
      ['id', 'sexo', 'idade'],
      { sexo: 'categorical' }
    );

    expect(result.numericColumns).toEqual(['id', 'idade']);
    expect(result.factorColumns).toEqual(['sexo']);
  });

  it('keeps the first column when the user confirms no id column is present', () => {
    const result = applyColumnTypeOverrides(
      ['id', 'sexo', 'idade'],
      ['id', 'sexo', 'idade'],
      { sexo: 'categorical' },
      null
    );

    expect(result.analysisNumericColumns).toEqual(['id', 'idade']);
    expect(result.analysisFactorColumns).toEqual(['sexo']);
    expect(result.idColumn).toBeNull();
  });
});
