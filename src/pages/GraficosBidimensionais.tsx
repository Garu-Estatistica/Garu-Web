import { useState, useMemo } from 'react';
import { Grid, Paper, Title, Text, Select, Tabs, Table } from '@mantine/core';
import PageWrapper from '../components/PageWrapper';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from 'recharts';
import { COLORFUL, DARK_CYAN } from '../utils/colors';
import { contingencyTable, quartiles, iqr, mean } from '../utils/statistics';
import { formatBR } from '../utils/formatting';
import {
  dadosSaudeAlimentacao,
  SHORT_LEVEL_COLUMNS,
  NUMERIC_COLUMNS,
} from '../data/dadosSaudeAlimentacao';
import { getFactorValues, getNumericValues } from '../data';

export default function GraficosBidimensionais() {
  // Tab 1: Two qualitative
  const [qual1, setQual1] = useState<string>(SHORT_LEVEL_COLUMNS[0]);
  const [qual2, setQual2] = useState<string>(SHORT_LEVEL_COLUMNS[1]);

  // Tab 2: Two quantitative
  const [quant1, setQuant1] = useState<string>(NUMERIC_COLUMNS[1]); // Peso
  const [quant2, setQuant2] = useState<string>(NUMERIC_COLUMNS[3]); // Altura

  // Tab 3: Qualitative + quantitative
  const [qualMixed, setQualMixed] = useState<string>(SHORT_LEVEL_COLUMNS[0]);
  const [quantMixed, setQuantMixed] = useState<string>(NUMERIC_COLUMNS[1]);

  // --- Tab 1 computations ---
  const ctable = useMemo(() => {
    const v1 = getFactorValues(dadosSaudeAlimentacao, qual1);
    const v2 = getFactorValues(dadosSaudeAlimentacao, qual2);
    return contingencyTable(v1, v2);
  }, [qual1, qual2]);

  const stackedData = useMemo(() => {
    return ctable.rowLabels.map((rowLabel, ri) => {
      const entry: Record<string, string | number> = { name: rowLabel };
      const rowTotal = ctable.rowTotals[ri];
      ctable.colLabels.forEach((colLabel, ci) => {
        entry[colLabel] = rowTotal > 0
          ? Number(((ctable.matrix[ri][ci] / rowTotal) * 100).toFixed(1))
          : 0;
      });
      return entry;
    });
  }, [ctable]);

  // --- Tab 2 computations ---
  const scatterData = useMemo(() => {
    const x = getNumericValues(dadosSaudeAlimentacao, quant1);
    const y = getNumericValues(dadosSaudeAlimentacao, quant2);
    const n = Math.min(x.length, y.length);
    return Array.from({ length: n }, (_, i) => ({ x: x[i], y: y[i] }));
  }, [quant1, quant2]);

  // --- Tab 3 computations ---
  const boxplotByCategory = useMemo(() => {
    const cats = getFactorValues(dadosSaudeAlimentacao, qualMixed);
    const nums = getNumericValues(dadosSaudeAlimentacao, quantMixed);
    const groups = new Map<string, number[]>();
    for (let i = 0; i < Math.min(cats.length, nums.length); i++) {
      const cat = cats[i] || '(vazio)';
      if (!groups.has(cat)) groups.set(cat, []);
      groups.get(cat)!.push(nums[i]);
    }
    const result: {
      category: string;
      q1: number;
      q2: number;
      q3: number;
      whiskerLow: number;
      whiskerHigh: number;
      outliers: number[];
      meanVal: number;
      min: number;
      max: number;
    }[] = [];
    for (const [cat, vals] of groups) {
      if (vals.length < 4) continue;
      const q = quartiles(vals);
      const iqrVal = iqr(vals);
      const lowerFence = q.q1 - 1.5 * iqrVal;
      const upperFence = q.q3 + 1.5 * iqrVal;
      const sorted = [...vals].sort((a, b) => a - b);
      const whiskerLow = sorted.find((v) => v >= lowerFence) ?? sorted[0];
      const whiskerHigh = [...sorted].reverse().find((v) => v <= upperFence) ?? sorted[sorted.length - 1];
      const outliers = vals.filter((v) => v < lowerFence || v > upperFence);
      result.push({
        category: cat,
        q1: q.q1,
        q2: q.q2,
        q3: q.q3,
        whiskerLow,
        whiskerHigh,
        outliers,
        meanVal: mean(vals),
        min: sorted[0],
        max: sorted[sorted.length - 1],
      });
    }
    return result;
  }, [qualMixed, quantMixed]);

  const renderMultiBoxplot = () => {
    if (boxplotByCategory.length === 0) return <Text c="dimmed">Dados insuficientes.</Text>;
    const allVals = boxplotByCategory.flatMap((b) => [b.min, b.max, ...b.outliers]);
    const plotMin = Math.min(...allVals) - 2;
    const plotMax = Math.max(...allVals) + 2;
    const svgW = 700;
    const rowH = 60;
    const svgH = boxplotByCategory.length * rowH + 30;
    const padL = 120;
    const padR = 40;
    const plotW = svgW - padL - padR;
    const scale = (v: number) => padL + ((v - plotMin) / (plotMax - plotMin)) * plotW;
    const boxH = 30;

    return (
      <svg width="100%" viewBox={`0 0 ${svgW} ${svgH}`}>
        {boxplotByCategory.map((bp, idx) => {
          const cy = idx * rowH + rowH / 2 + 10;
          const boxY = cy - boxH / 2;
          return (
            <g key={idx}>
              <text x={padL - 8} y={cy + 4} textAnchor="end" fontSize={10} fill="#333">
                {bp.category}
              </text>
              {/* Whisker line */}
              <line x1={scale(bp.whiskerLow)} y1={cy} x2={scale(bp.whiskerHigh)} y2={cy} stroke="#333" strokeWidth={1} />
              {/* Whisker caps */}
              <line x1={scale(bp.whiskerLow)} y1={boxY + 5} x2={scale(bp.whiskerLow)} y2={boxY + boxH - 5} stroke="#333" strokeWidth={1} />
              <line x1={scale(bp.whiskerHigh)} y1={boxY + 5} x2={scale(bp.whiskerHigh)} y2={boxY + boxH - 5} stroke="#333" strokeWidth={1} />
              {/* Box */}
              <rect x={scale(bp.q1)} y={boxY} width={scale(bp.q3) - scale(bp.q1)} height={boxH} fill={COLORFUL[idx % COLORFUL.length]} opacity={0.4} stroke={COLORFUL[idx % COLORFUL.length]} strokeWidth={1.5} />
              {/* Median */}
              <line x1={scale(bp.q2)} y1={boxY} x2={scale(bp.q2)} y2={boxY + boxH} stroke="#e03131" strokeWidth={2} />
              {/* Outliers */}
              {bp.outliers.map((o, oi) => (
                <circle key={oi} cx={scale(o)} cy={cy} r={3} fill="orange" stroke="#333" strokeWidth={0.5} />
              ))}
            </g>
          );
        })}
      </svg>
    );
  };

  return (
    <PageWrapper size="xl">

      <Tabs defaultValue="qualqual">
        <Tabs.List mb="md">
          <Tabs.Tab value="qualqual">Duas Qualitativas</Tabs.Tab>
          <Tabs.Tab value="quantquant">Duas Quantitativas</Tabs.Tab>
          <Tabs.Tab value="qualquant">Qualitativa + Quantitativa</Tabs.Tab>
        </Tabs.List>

        {/* Tab 1: Two Qualitatives */}
        <Tabs.Panel value="qualqual">
          <Grid gutter="lg">
            <Grid.Col span={12}>
              <Paper shadow="xs" p="md" withBorder>
                <Grid>
                  <Grid.Col span={6}>
                    <Select
                      label="Variavel 1 (linhas)"
                      data={SHORT_LEVEL_COLUMNS.map((c) => ({ value: c, label: c }))}
                      value={qual1}
                      onChange={(val) => val && setQual1(val)}
                    />
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Select
                      label="Variavel 2 (colunas)"
                      data={SHORT_LEVEL_COLUMNS.map((c) => ({ value: c, label: c }))}
                      value={qual2}
                      onChange={(val) => val && setQual2(val)}
                    />
                  </Grid.Col>
                </Grid>
              </Paper>
            </Grid.Col>

            <Grid.Col span={7}>
              <Paper shadow="xs" p="md" withBorder>
                <Title order={5} mb="sm">Gráfico de Barras Empilhadas (%)</Title>
                <ResponsiveContainer width="100%" height={420}>
                  <BarChart data={stackedData} margin={{ top: 20, right: 20, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-35} textAnchor="end" interval={0} tick={{ fontSize: 11, dy: 10 }} tickMargin={5} height={110} label={{ value: qual1, position: 'insideBottom', offset: -10, style: { fontSize: 14, fill: '#333' } }} />
                    <YAxis domain={[0, 100]} tickFormatter={(v: number) => `${v}%`} label={{ value: 'Frequência Relativa (%)', angle: -90, position: 'insideLeft', offset: -5, style: { fontSize: 14, fill: '#333' } }} />
                    <Tooltip formatter={(value: number | string | undefined) => `${value ?? ''}%`} />
                    <Legend />
                    {ctable.colLabels.map((col, ci) => (
                      <Bar key={col} dataKey={col} stackId="a" fill={COLORFUL[ci % COLORFUL.length]} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </Grid.Col>

            <Grid.Col span={5}>
              <Paper shadow="xs" p="md" withBorder>
                <Title order={5} mb="sm">Tabela de Frequencias Cruzadas</Title>
                <div style={{ overflowX: 'auto' }}>
                  <Table striped highlightOnHover withTableBorder withColumnBorders style={{ fontSize: 12 }}>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>{qual1} / {qual2}</Table.Th>
                        {ctable.colLabels.map((col) => (
                          <Table.Th key={col}>{col}</Table.Th>
                        ))}
                        <Table.Th>Total</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {ctable.rowLabels.map((row, ri) => (
                        <Table.Tr key={row}>
                          <Table.Td fw={600}>{row}</Table.Td>
                          {ctable.matrix[ri].map((val, ci) => (
                            <Table.Td key={ci}>{val}</Table.Td>
                          ))}
                          <Table.Td fw={600}>{ctable.rowTotals[ri]}</Table.Td>
                        </Table.Tr>
                      ))}
                      <Table.Tr fw={700}>
                        <Table.Td>Total</Table.Td>
                        {ctable.colTotals.map((val, ci) => (
                          <Table.Td key={ci}>{val}</Table.Td>
                        ))}
                        <Table.Td>{ctable.grandTotal}</Table.Td>
                      </Table.Tr>
                    </Table.Tbody>
                  </Table>
                </div>
              </Paper>
            </Grid.Col>
          </Grid>
        </Tabs.Panel>

        {/* Tab 2: Two Quantitatives */}
        <Tabs.Panel value="quantquant">
          <Grid gutter="lg">
            <Grid.Col span={12}>
              <Paper shadow="xs" p="md" withBorder>
                <Grid>
                  <Grid.Col span={6}>
                    <Select
                      label="Variavel X"
                      data={NUMERIC_COLUMNS.map((c) => ({ value: c, label: c }))}
                      value={quant1}
                      onChange={(val) => val && setQuant1(val)}
                    />
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Select
                      label="Variavel Y"
                      data={NUMERIC_COLUMNS.map((c) => ({ value: c, label: c }))}
                      value={quant2}
                      onChange={(val) => val && setQuant2(val)}
                    />
                  </Grid.Col>
                </Grid>
              </Paper>
            </Grid.Col>
            <Grid.Col span={12}>
              <Paper shadow="xs" p="md" withBorder>
                <Title order={5} mb="sm">Diagrama de Dispersao</Title>
                <ResponsiveContainer width="100%" height={440}>
                  <ScatterChart margin={{ top: 20, right: 30, left: 30, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="x" type="number" name={quant1} label={{ value: quant1, position: 'insideBottom', offset: -10, style: { fontSize: 14, fill: '#333' } }} height={60} />
                    <YAxis dataKey="y" type="number" name={quant2} label={{ value: quant2, angle: -90, position: 'insideLeft', offset: -10, style: { fontSize: 14, fill: '#333' } }} />
                    <Tooltip
                      formatter={(value: number | string | undefined) => typeof value === 'number' ? formatBR(value, 2) : value}
                      labelFormatter={() => ''}
                    />
                    <Scatter name="Dados" data={scatterData} fill={DARK_CYAN}>
                      {scatterData.map((_, i) => (
                        <Cell key={i} fill={DARK_CYAN} />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </Paper>
            </Grid.Col>
          </Grid>
        </Tabs.Panel>

        {/* Tab 3: Qualitative + Quantitative */}
        <Tabs.Panel value="qualquant">
          <Grid gutter="lg">
            <Grid.Col span={12}>
              <Paper shadow="xs" p="md" withBorder>
                <Grid>
                  <Grid.Col span={6}>
                    <Select
                      label="Variavel qualitativa (categorias)"
                      data={SHORT_LEVEL_COLUMNS.map((c) => ({ value: c, label: c }))}
                      value={qualMixed}
                      onChange={(val) => val && setQualMixed(val)}
                    />
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Select
                      label="Variavel quantitativa (valores)"
                      data={NUMERIC_COLUMNS.map((c) => ({ value: c, label: c }))}
                      value={quantMixed}
                      onChange={(val) => val && setQuantMixed(val)}
                    />
                  </Grid.Col>
                </Grid>
              </Paper>
            </Grid.Col>
            <Grid.Col span={12}>
              <Paper shadow="xs" p="md" withBorder>
                <Title order={5} mb="sm">Boxplots por Categoria</Title>
                <Text size="sm" mb="sm" c="dimmed">
                  Cada boxplot mostra a distribuicao de {quantMixed} para cada nivel de {qualMixed}.
                </Text>
                {renderMultiBoxplot()}
              </Paper>
            </Grid.Col>
          </Grid>
        </Tabs.Panel>
      </Tabs>
    </PageWrapper>
  );
}
