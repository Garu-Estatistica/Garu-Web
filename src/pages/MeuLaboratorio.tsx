import { useState, useMemo } from 'react';
import { Text, Title, Paper, Alert, FileInput, Button, Group, Badge, Tabs, Loader, SegmentedControl, Stack, Radio, Table } from '@mantine/core';
import { Link } from 'react-router-dom';
import PageWrapper from '../components/PageWrapper';
import { IconAlertCircle, IconUpload, IconFileCheck, IconClearAll } from '@tabler/icons-react';
import { useCustomLabStore } from '../stores/useCustomLabStore';
import { applyColumnTypeOverrides, parseCustomCSV, type ColumnType } from '../utils/csvParser';
import GenericQuiQuadrado from '../components/calculators/GenericQuiQuadrado';
import GenericTesteCorrelacao from '../components/calculators/GenericTesteCorrelacao';
import GenericMedidasResumo from '../components/calculators/GenericMedidasResumo';
import GenericTabelaFrequencias from '../components/calculators/GenericTabelaFrequencias';
import GraficoUnivariavel from '../components/calculators/GraficoUnivariavel';
import GraficoBivariavel from '../components/calculators/GraficoBivariavel';
import GenericTesteT from '../components/calculators/GenericTesteT';
import DataTableView from '../components/calculators/DataTableView';

export default function MeuLaboratorio() {
  const { customDataset, fileName, numericColumns, factorColumns, allColumns, idColumn, hasIdColumn, setCustomDataset, clearCustomDataset } = useCustomLabStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reviewDataset, setReviewDataset] = useState<{ data: any[]; allColumns: string[]; numericColumns: string[]; factorColumns: string[]; columnTypes: Record<string, ColumnType>; fileName: string } | null>(null);
  const [reviewTypes, setReviewTypes] = useState<Record<string, ColumnType>>({});
  const [reviewHasIdColumn, setReviewHasIdColumn] = useState(true);
  const [reviewIdColumn, setReviewIdColumn] = useState<string | null>(null);

  const resolvedIdColumn = customDataset ? (hasIdColumn ? idColumn : null) : reviewHasIdColumn && reviewIdColumn ? reviewIdColumn : null;
  const analysisNumericCols = useMemo(() => {
    const columns = customDataset ? numericColumns : reviewDataset?.numericColumns ?? [];
    if (!resolvedIdColumn) {
      return columns;
    }
    return columns.filter((column) => column !== resolvedIdColumn);
  }, [customDataset, numericColumns, reviewDataset, resolvedIdColumn]);

  const analysisFactorCols = useMemo(() => {
    const columns = customDataset ? factorColumns : reviewDataset?.factorColumns ?? [];
    if (!resolvedIdColumn) {
      return columns;
    }
    return columns.filter((column) => column !== resolvedIdColumn);
  }, [customDataset, factorColumns, reviewDataset, resolvedIdColumn]);

  const [descritivaTab, setDescritivaTab] = useState('resumo');
  const [graficosTab, setGraficosTab] = useState('univariavel');
  const [inferenciaTab, setInferenciaTab] = useState('qui');

  const handleFileUpload = async (file: File | null) => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const result = await parseCustomCSV(file);
      const nextTypes = Object.fromEntries(
        result.allColumns.map((column) => [column, result.numericColumns.includes(column) ? 'numeric' : 'categorical'])
      ) as Record<string, ColumnType>;
      setReviewDataset({
        data: result.data,
        allColumns: result.allColumns,
        numericColumns: result.numericColumns,
        factorColumns: result.factorColumns,
        columnTypes: nextTypes,
        fileName: file.name,
      });
      setReviewTypes(nextTypes);
      setReviewHasIdColumn(true);
      setReviewIdColumn(result.allColumns[0] ?? null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido ao processar o arquivo.');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewConfirm = () => {
    if (!reviewDataset) return;

    const idColumnToUse = reviewHasIdColumn ? reviewIdColumn : null;
    const { numericColumns: parsedNumeric, factorColumns: parsedFactor } = applyColumnTypeOverrides(
      reviewDataset.allColumns,
      reviewDataset.numericColumns,
      reviewTypes,
      idColumnToUse,
    );

    const finalData = reviewDataset.data.map((row) => {
      const nextRow: Record<string, string | number | null> = {};
      reviewDataset.allColumns.forEach((column) => {
        const value = row[column];
        if (reviewIdColumn && column === reviewIdColumn && idColumnToUse === reviewIdColumn) {
          nextRow[column] = value;
          return;
        }

        const resolvedType = reviewTypes[column] ?? (reviewDataset.numericColumns.includes(column) ? 'numeric' : 'categorical');
        nextRow[column] = resolvedType === 'numeric' ? Number(value ?? 0) : String(value ?? '');
      });
      return nextRow;
    });

    setCustomDataset(finalData, reviewDataset.fileName, parsedNumeric, parsedFactor, reviewDataset.allColumns, idColumnToUse, idColumnToUse !== null);
    setReviewDataset(null);
    setReviewTypes({});
    setError(null);
  };

  const handleLoadNew = () => {
    clearCustomDataset();
    setReviewDataset(null);
    setReviewTypes({});
    setReviewIdColumn(null);
    setReviewHasIdColumn(true);
    setError(null);
  };

  const renderReviewStep = () => (
    <Paper shadow="sm" p="xl" withBorder>
      <Title order={4} mb="md">Revisar tipos das variáveis</Title>
      <Text size="sm" c="dimmed" mb="lg">
        Revise a classificação automática antes de liberar as análises. Você pode alterar colunas numéricas para categóricas e definir se o arquivo possui identificador (ID).
      </Text>

      <Stack gap="md" mb="xl">
        <Radio.Group
          value={reviewHasIdColumn ? 'sim' : 'nao'}
          onChange={(value) => {
            const hasId = value === 'sim';
            setReviewHasIdColumn(hasId);
            if (hasId && reviewIdColumn === null && reviewDataset?.allColumns.length) {
              setReviewIdColumn(reviewDataset.allColumns[0]);
            }
            if (!hasId) {
              setReviewIdColumn(null);
            }
          }}
          label="O arquivo possui coluna de ID?"
        >
          <Group mt="xs">
            <Radio value="sim" label="Sim" />
            <Radio value="nao" label="Não" />
          </Group>
        </Radio.Group>

        {reviewHasIdColumn && reviewDataset && reviewDataset.allColumns.length > 0 && (
          <div>
            <Text size="sm" fw={600} mb="xs">Selecione a coluna de ID</Text>
            <SegmentedControl
              value={reviewIdColumn ?? reviewDataset.allColumns[0]}
              onChange={setReviewIdColumn}
              data={reviewDataset.allColumns.map((column) => ({ label: column, value: column }))}
            />
          </div>
        )}
      </Stack>

      <Table striped highlightOnHover withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Nome da coluna</Table.Th>
            <Table.Th>Tipo inferido</Table.Th>
            <Table.Th>Alterar tipo</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {reviewDataset?.allColumns.map((column) => (
            <Table.Tr key={column}>
              <Table.Td>{column}</Table.Td>
              <Table.Td>
                <Badge color={reviewTypes[column] === 'numeric' ? 'blue' : 'teal'} variant="light">
                  {reviewTypes[column] === 'numeric' ? 'Numérica' : 'Categórica'}
                </Badge>
              </Table.Td>
              <Table.Td>
                <SegmentedControl
                  value={reviewTypes[column] === 'numeric' ? 'numeric' : 'categorical'}
                  onChange={(value) => {
                    const nextType = value as ColumnType;
                    setReviewTypes((prev) => ({ ...prev, [column]: nextType }));
                  }}
                  data={[
                    { label: 'Numérica', value: 'numeric' },
                    { label: 'Categórica', value: 'categorical' },
                  ]}
                />
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>

      <Group justify="flex-end" mt="xl">
        <Button variant="default" onClick={handleLoadNew}>Voltar</Button>
        <Button onClick={handleReviewConfirm}>Confirmar e liberar análises</Button>
      </Group>
    </Paper>
  );

  return (
    <PageWrapper size="xl">
      {!customDataset && !reviewDataset ? (
        <Paper shadow="sm" p="xl" withBorder>
          <Alert icon={<IconAlertCircle size={16} />} title="Instruções para formatação da base de dados" color="blue" mb="lg">
            <Text component="div" size="sm">
              Antes de enviar seu arquivo <strong>.csv</strong>, verifique:
              <ul style={{ marginTop: 8, marginBottom: 0, paddingLeft: 20 }}>
                <li>A primeira linha deve conter os nomes das variáveis.</li>
                <li>Nos nomes das colunas, não use espaços, acentos ou caracteres especiais.</li>
                <li>Dados ausentes devem ser deixados em branco ou identificados como NA.</li>
                <li>Para números decimais, use ponto como separador (ex.: 1.75).</li>
                <li>Se o banco possuir um identificador (ID) para cada registro, coloque-o na primeira coluna. Caso não possua, deixe essa coluna vazia.</li>
              </ul>
            </Text>
          </Alert>

          <Group justify="flex-start" mt="md">
            <Button component={Link} to="/conjuntos-de-dados" variant="light" color="blue">
              Acessar conjuntos de dados
            </Button>
          </Group>

          <FileInput
            label="Carregar Base de Dados (.csv)"
            placeholder="Clique ou arraste seu arquivo .csv aqui"
            accept="text/csv"
            leftSection={<IconUpload size={14} />}
            onChange={handleFileUpload}
            disabled={loading}
            mt="md"
            size="md"
          />

          {loading && (
            <Group mt="md">
              <Loader size="sm" />
              <Text size="sm">Processando e interpretando dados...</Text>
            </Group>
          )}

          {error && (
            <Alert icon={<IconAlertCircle size={16} />} title="Erro" color="red" mt="md">
              {error}
            </Alert>
          )}
        </Paper>
      ) : customDataset ? (
        <>
          <Paper shadow="sm" p="md" withBorder mb="lg">
            <Group justify="space-between" align="flex-start">
              <div>
                <Group gap="xs" mb="xs">
                  <IconFileCheck color="green" />
                  <Title order={5}>Arquivo: {fileName}</Title>
                </Group>
                <Text size="sm" c="dimmed">Total de registros válidos encontrados: {customDataset.length}</Text>
                
                <Text size="sm" fw={600} mt="md">Variáveis Numéricas Inferidas ({numericColumns.length}):</Text>
                <Group gap="xs" mt={5}>
                  {numericColumns.map(col => <Badge key={col} color="blue" variant="light">{col}</Badge>)}
                  {numericColumns.length === 0 && <Text size="xs" c="dimmed">Nenhuma</Text>}
                </Group>

                <Text size="sm" fw={600} mt="md">Variáveis Categóricas/Fatores Inferidos ({factorColumns.length}):</Text>
                <Group gap="xs" mt={5}>
                  {factorColumns.map(col => <Badge key={col} color="teal" variant="light">{col}</Badge>)}
                  {factorColumns.length === 0 && <Text size="xs" c="dimmed">Nenhuma</Text>}
                </Group>
              </div>
              <Button variant="subtle" color="red" leftSection={<IconClearAll size={16} />} onClick={handleLoadNew}>
                Carregar novo
              </Button>
            </Group>
          </Paper>

          <Paper shadow="sm" p="md" withBorder>
            <Tabs defaultValue="dados">
              <Tabs.List grow mb="md">
                <Tabs.Tab value="dados">Visualizar Dados</Tabs.Tab>
                <Tabs.Tab value="descritiva">Medidas Resumo</Tabs.Tab>
                <Tabs.Tab value="graficos">Gráficos</Tabs.Tab>
                <Tabs.Tab value="inferencia">Inferência</Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="dados">
                <DataTableView dataset={customDataset} columns={allColumns || [...numericColumns, ...factorColumns]} />
              </Tabs.Panel>

              <Tabs.Panel value="descritiva" pt="md">
                <Group mb="md" grow>
                  <SegmentedControl
                    color="cyan"
                    radius="md"
                    size="sm"
                    value={descritivaTab}
                    onChange={setDescritivaTab}
                    data={[
                      { label: 'Medidas Resumo', value: 'resumo' },
                      { label: 'Tabela de Frequência', value: 'frequencia' }
                    ]}
                  />
                </Group>
                {descritivaTab === 'resumo' && (
                  <GenericMedidasResumo dataset={customDataset} numericCols={analysisNumericCols} />
                )}
                {descritivaTab === 'frequencia' && (
                  <GenericTabelaFrequencias dataset={customDataset} factorCols={analysisFactorCols} />
                )}
              </Tabs.Panel>

              <Tabs.Panel value="graficos" pt="md">
                <Group mb="md" grow>
                  <SegmentedControl
                    color="cyan"
                    radius="md"
                    size="sm"
                    value={graficosTab}
                    onChange={setGraficosTab}
                    data={[
                      { label: 'Univariado', value: 'univariavel' },
                      { label: 'Bivariado', value: 'bivariavel' }
                    ]}
                  />
                </Group>
                {graficosTab === 'univariavel' && (
                  <GraficoUnivariavel dataset={customDataset} numericCols={analysisNumericCols} factorCols={analysisFactorCols} firstColumn={resolvedIdColumn} />
                )}
                {graficosTab === 'bivariavel' && (
                  <GraficoBivariavel dataset={customDataset} numericCols={analysisNumericCols} factorCols={analysisFactorCols} firstColumn={resolvedIdColumn} />
                )}
              </Tabs.Panel>

              <Tabs.Panel value="inferencia" pt="md">
                <Group mb="md" grow>
                  <SegmentedControl
                    color="cyan"
                    radius="md"
                    size="sm"
                    value={inferenciaTab}
                    onChange={setInferenciaTab}
                    data={[
                      { label: 'Testes de Associação', value: 'qui' },
                      { label: 'Teste de Correlação', value: 'correlacao' },
                      { label: 'Teste para Média', value: 'testet' }
                    ]}
                  />
                </Group>
                
                {inferenciaTab === 'qui' && (
                  <GenericQuiQuadrado dataset={customDataset} factorCols={analysisFactorCols} />
                )}
                {inferenciaTab === 'correlacao' && (
                  <GenericTesteCorrelacao dataset={customDataset} numericCols={analysisNumericCols} />
                )}
                {inferenciaTab === 'testet' && (
                  <GenericTesteT dataset={customDataset} numericCols={analysisNumericCols} factorCols={analysisFactorCols} />
                )}
              </Tabs.Panel>
            </Tabs>
          </Paper>
        </>
      ) : (
        renderReviewStep()
      )}
    </PageWrapper>
  );
}