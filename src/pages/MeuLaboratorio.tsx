import { useState, useMemo } from 'react';
import { Text, Title, Paper, Alert, FileInput, Button, Group, Badge, Tabs, Loader, SegmentedControl } from '@mantine/core';
import { Link } from 'react-router-dom';
import PageWrapper from '../components/PageWrapper';
import { IconAlertCircle, IconUpload, IconFileCheck, IconClearAll } from '@tabler/icons-react';
import { useCustomLabStore } from '../stores/useCustomLabStore';
import { parseCustomCSV } from '../utils/csvParser';
import GenericQuiQuadrado from '../components/calculators/GenericQuiQuadrado';
import GenericTesteCorrelacao from '../components/calculators/GenericTesteCorrelacao';
import GenericMedidasResumo from '../components/calculators/GenericMedidasResumo';
import GenericTabelaFrequencias from '../components/calculators/GenericTabelaFrequencias';
import GraficoUnivariavel from '../components/calculators/GraficoUnivariavel';
import GraficoBivariavel from '../components/calculators/GraficoBivariavel';
import GenericTesteT from '../components/calculators/GenericTesteT';
import DataTableView from '../components/calculators/DataTableView';

export default function MeuLaboratorio() {
  const { customDataset, fileName, numericColumns, factorColumns, allColumns, setCustomDataset, clearCustomDataset } = useCustomLabStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Detect the first column (ID column) and exclude it from analysis selectors
  const firstColumn = useMemo(() => {
    if (customDataset && customDataset.length > 0) {
      return Object.keys(customDataset[0])[0];
    }
    return null;
  }, [customDataset]);
  const analysisNumericCols = useMemo(() => firstColumn ? numericColumns.filter(c => c !== firstColumn) : numericColumns, [numericColumns, firstColumn]);
  const analysisFactorCols = useMemo(() => firstColumn ? factorColumns.filter(c => c !== firstColumn) : factorColumns, [factorColumns, firstColumn]);

  const [descritivaTab, setDescritivaTab] = useState('resumo');
  const [graficosTab, setGraficosTab] = useState('univariavel');
  const [inferenciaTab, setInferenciaTab] = useState('qui');

  const handleFileUpload = async (file: File | null) => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const result = await parseCustomCSV(file);
      setCustomDataset(result.data, file.name, result.numericColumns, result.factorColumns, result.allColumns);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido ao processar o arquivo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper size="xl">

      {!customDataset ? (
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
      ) : (
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
              <Button variant="subtle" color="red" leftSection={<IconClearAll size={16} />} onClick={clearCustomDataset}>
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
                  <GraficoUnivariavel dataset={customDataset} numericCols={analysisNumericCols} factorCols={analysisFactorCols} firstColumn={firstColumn} />
                )}
                {graficosTab === 'bivariavel' && (
                  <GraficoBivariavel dataset={customDataset} numericCols={analysisNumericCols} factorCols={analysisFactorCols} firstColumn={firstColumn} />
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
      )}
    </PageWrapper>
  );
}