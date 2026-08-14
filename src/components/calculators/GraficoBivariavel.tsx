import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Container, Grid, Paper, Title, Text, Select, Alert, SegmentedControl, Group, Table, Checkbox, Button } from '@mantine/core';
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
import { COLORFUL, DARK_CYAN } from '../../utils/colors';
import { CategoryOrderControl } from './CategoryOrderControl';
import { contingencyTable, quartiles, iqr, mean, pearsonCorrelation, spearmanCorrelation, getNiceTicks } from '../../utils/statistics';
import { formatBR } from '../../utils/formatting';
import { CustomXAxisTick } from './CustomXAxisTick';
import { exportChartAsPNG } from '../../utils/exportChart';
import { IconAlertTriangle, IconDownload } from '@tabler/icons-react';

type BiChartType = 'barras_agrupadas' | 'barras_empilhadas' | 'dispersao' | 'boxplot_cat';
type FreqMode = 'absoluta' | 'percentual';
type PercMode = 'linha' | 'coluna' | 'geral';

interface GraficoBivariavelProps {
  dataset: Record<string, string | number | null>[];
  numericCols: string[];
  factorCols: string[];
  firstColumn: string | null;
}

const CHART_OPTIONS: { value: BiChartType; label: string }[] = [
  { value: 'barras_agrupadas', label: 'Barras Agrupadas' },
  { value: 'barras_empilhadas', label: 'Barras Empilhadas' },
  { value: 'dispersao', label: 'Diagrama de Dispersão' },
  { value: 'boxplot_cat', label: 'Boxplot por Categoria' },
];

export default function GraficoBivariavel({ dataset, numericCols, factorCols, firstColumn }: GraficoBivariavelProps) {
  const allCols = useMemo(() => [...factorCols, ...numericCols], [factorCols, numericCols]);
  const [var1, setVar1] = useState<string>(allCols[0] || '');
  const [var2, setVar2] = useState<string>(allCols[1] || allCols[0] || '');
  const [chartType, setChartType] = useState<BiChartType>('barras_agrupadas');
  const [freqMode, setFreqMode] = useState<FreqMode>('absoluta');
  const [percMode, setPercMode] = useState<PercMode>('geral');
  const [showContingency, setShowContingency] = useState(false);
  const [showMeasures, setShowMeasures] = useState(true);

  const isNum1 = numericCols.includes(var1);
  const isNum2 = numericCols.includes(var2);
  const isFac1 = factorCols.includes(var1);
  const isFac2 = factorCols.includes(var2);

  // Determine valid chart types for current variable combination
  const validCharts = useMemo((): BiChartType[] => {
    if (isFac1 && isFac2) return ['barras_agrupadas', 'barras_empilhadas'];
    if (isNum1 && isNum2) return ['dispersao'];
    if ((isFac1 && isNum2) || (isNum1 && isFac2)) return ['boxplot_cat'];
    return [];
  }, [isFac1, isFac2, isNum1, isNum2]);

  const isInvalid = !validCharts.includes(chartType);

  // Derive which is the factor and which is the numeric for mixed combos
  const factorVar = isFac1 ? var1 : var2;
  const numericVar = isNum1 ? var1 : var2;

  const chartRef = useRef<HTMLDivElement>(null);

  // Custom ordering and visibility states
  const [customOrderVar1, setCustomOrderVar1] = useState<string[]>([]);
  const [customOrderVar2, setCustomOrderVar2] = useState<string[]>([]);
  const [hiddenVar1, setHiddenVar1] = useState<string[]>([]);
  const [hiddenVar2, setHiddenVar2] = useState<string[]>([]);

  useEffect(() => {
    setHiddenVar1([]);
  }, [var1]);

  useEffect(() => {
    setHiddenVar2([]);
  }, [var2]);

  const activeDataset = useMemo(() => {
    if ((hiddenVar1.length === 0 && hiddenVar2.length === 0) || dataset.length === 0) return dataset;
    return dataset.filter(row => {
      if (isFac1 && var1) {
        const v = row[var1];
        const cat = (v === null || v === undefined || String(v).trim() === '') ? '(vazio)' : String(v);
        if (hiddenVar1.includes(cat)) return false;
      }
      if (isFac2 && var2) {
        const v = row[var2];
        const cat = (v === null || v === undefined || String(v).trim() === '') ? '(vazio)' : String(v);
        if (hiddenVar2.includes(cat)) return false;
      }
      return true;
    });
  }, [dataset, hiddenVar1, hiddenVar2, isFac1, isFac2, var1, var2]);

  useEffect(() => {
    if (isFac1 && var1 && dataset.length > 0) {
      const unique = [...new Set(dataset.map(d => String(d[var1] ?? '')).filter(v => v.trim() !== ''))].sort();
      // eslint-disable-next-line react-compiler/react-compiler, react-hooks/exhaustive-deps
      setCustomOrderVar1(prev => {
        if (prev.length === unique.length && prev.every((v, i) => v === unique[i])) return prev;
        return unique;
      });
    } else {
      setCustomOrderVar1(prev => prev.length === 0 ? prev : []);
    }
  }, [var1, isFac1, dataset]);

  useEffect(() => {
    if (isFac2 && var2 && dataset.length > 0) {
      const unique = [...new Set(dataset.map(d => String(d[var2] ?? '')).filter(v => v.trim() !== ''))].sort();
      // eslint-disable-next-line react-compiler/react-compiler, react-hooks/exhaustive-deps
      setCustomOrderVar2(prev => {
        if (prev.length === unique.length && prev.every((v, i) => v === unique[i])) return prev;
        return unique;
      });
    } else {
      setCustomOrderVar2(prev => prev.length === 0 ? prev : []);
    }
  }, [var2, isFac2, dataset]);

  // --- Quali × Quali: Contingency ---
  const ctable = useMemo(() => {
    if (!isFac1 || !isFac2 || !var1 || !var2 || activeDataset.length === 0) return null;
    const v1 = activeDataset.map((d) => String(d[var1] ?? ''));
    const v2 = activeDataset.map((d) => String(d[var2] ?? ''));
    return contingencyTable(v1, v2, customOrderVar1, customOrderVar2);
  }, [activeDataset, var1, var2, isFac1, isFac2, customOrderVar1, customOrderVar2]);

  const barData = useMemo(() => {
    if (!ctable) return [];
    return ctable.rowLabels.map((rowLabel, ri) => {
      const entry: Record<string, string | number> = { name: rowLabel };
      ctable.colLabels.forEach((colLabel, ci) => {
        if (freqMode === 'percentual') {
          // Stacked: divide by row total so each bar sums to 100%
          // Grouped: divide by grand total
          const divisor = chartType === 'barras_empilhadas'
            ? ctable.rowTotals[ri]
            : ctable.grandTotal;
          entry[colLabel] = divisor > 0
            ? parseFloat(((ctable.matrix[ri][ci] / divisor) * 100).toFixed(1))
            : 0;
        } else {
          entry[colLabel] = ctable.matrix[ri][ci];
        }
      });
      return entry;
    });
  }, [ctable, freqMode, chartType]);

  // --- Quant × Quant: Scatter ---
  const scatterData = useMemo(() => {
    if (!isNum1 || !isNum2 || !var1 || !var2 || activeDataset.length === 0) return [];
    const result: { x: number; y: number }[] = [];
    for (const row of activeDataset) {
      const x = Number(row[var1]);
      const y = Number(row[var2]);
      if (!isNaN(x) && !isNaN(y) && row[var1] !== null && row[var2] !== null) {
        result.push({ x, y });
      }
    }
    return result;
  }, [activeDataset, var1, var2, isNum1, isNum2]);

  // --- Quali × Quant: Boxplot by category ---
  const boxplotByCategory = useMemo(() => {
    if (!(isFac1 !== isFac2) || !factorVar || !numericVar || activeDataset.length === 0) return [];
    const groups = new Map<string, { values: number[]; ids: string[] }>();
    for (const row of activeDataset) {
      const cat = String(row[factorVar] ?? '(vazio)');
      const val = Number(row[numericVar]);
      if (isNaN(val)) continue;
      if (!groups.has(cat)) groups.set(cat, { values: [], ids: [] });
      const g = groups.get(cat)!;
      g.values.push(val);
      g.ids.push(firstColumn && row[firstColumn] != null ? String(row[firstColumn]) : '');
    }
    const result: {
      category: string;
      q1: number; q2: number; q3: number;
      whiskerLow: number; whiskerHigh: number;
      outlierEntries: { value: number; id: string }[];
      min: number; max: number;
    }[] = [];
    for (const [cat, { values, ids }] of groups) {
      if (values.length < 4) continue;
      const sorted = [...values].sort((a, b) => a - b);
      const q = quartiles(sorted);
      const iqrVal = iqr(sorted);
      const lowerFence = q.q1 - 1.5 * iqrVal;
      const upperFence = q.q3 + 1.5 * iqrVal;
      const whiskerLow = sorted.find((v) => v >= lowerFence) ?? sorted[0];
      const whiskerHigh = [...sorted].reverse().find((v) => v <= upperFence) ?? sorted[sorted.length - 1];
      const outlierEntries: { value: number; id: string }[] = [];
      values.forEach((v, i) => {
        if (v < lowerFence || v > upperFence) {
          outlierEntries.push({ value: v, id: ids[i] });
        }
      });
      result.push({
        category: cat,
        q1: q.q1, q2: q.q2, q3: q.q3,
        whiskerLow, whiskerHigh,
        outlierEntries,
        min: sorted[0],
        max: sorted[sorted.length - 1],
      });
    }

    const order = factorVar === var1 ? customOrderVar1 : customOrderVar2;
    if (order && order.length > 0) {
      result.sort((a, b) => {
        const idxA = order.indexOf(a.category);
        const idxB = order.indexOf(b.category);
        if (idxA === -1 && idxB === -1) return a.category.localeCompare(b.category);
        if (idxA === -1) return 1;
        if (idxB === -1) return -1;
        return idxA - idxB;
      });
    }

    return result;
  }, [activeDataset, factorVar, numericVar, isFac1, isFac2, firstColumn, customOrderVar1, customOrderVar2, var1, var2]);

  // --- Summary measures ---
  const measures = useMemo(() => {
    if (!isNum1 && !isNum2) return null;
    const v1_arr: number[] = [];
    const v2_arr: number[] = [];

    activeDataset.forEach((row) => {
      if (isNum1) {
        const val = Number(row[var1]);
        if (!isNaN(val) && row[var1] !== null) {
          v1_arr.push(val);
        }
      }
      if (isNum2) {
        const val = Number(row[var2]);
        if (!isNaN(val) && row[var2] !== null) {
          v2_arr.push(val);
        }
      }
    });

    if (isNum1 && isNum2) {
      const n = Math.min(v1_arr.length, v2_arr.length);
      return {
        type: 'quant_quant' as const,
        pearson: pearsonCorrelation(v1_arr.slice(0, n), v2_arr.slice(0, n)),
        spearman: spearmanCorrelation(v1_arr.slice(0, n), v2_arr.slice(0, n)),
        n,
      };
    }
    if ((isFac1 && isNum2) || (isNum1 && isFac2)) {
      // Measures per category
      const groups = new Map<string, number[]>();
      for (const row of activeDataset) {
        const cat = String(row[factorVar] ?? '(vazio)');
        const val = Number(row[numericVar]);
        if (isNaN(val)) continue;
        if (!groups.has(cat)) groups.set(cat, []);
        groups.get(cat)!.push(val);
      }
      const cats: { cat: string; n: number; mean: number; median: number; sd: number }[] = [];
      for (const [cat, vals] of groups) {
        if (vals.length === 0) continue;
        const sorted = [...vals].sort((a, b) => a - b);
        const m = mean(sorted);
        const med = sorted.length % 2 === 1
          ? sorted[Math.floor(sorted.length / 2)]
          : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2;
        const sd = Math.sqrt(vals.reduce((s, v) => s + (v - m) ** 2, 0) / (vals.length - 1 || 1));
        cats.push({ cat, n: vals.length, mean: m, median: med, sd });
      }
      return { type: 'mixed' as const, cats };
    }
    return null;
  }, [activeDataset, var1, var2, isNum1, isNum2, isFac1, isFac2, factorVar, numericVar]);

  // Outlier hover for bivariable boxplots
  const [hoveredOutlier, setHoveredOutlier] = useState<{ value: number; id: string } | null>(null);

  const renderVerticalMultiBoxplot = useCallback(() => {
    if (boxplotByCategory.length === 0) return <Text c="dimmed">Dados insuficientes ou categorias com &lt; 4 itens.</Text>;
    const allVals = boxplotByCategory.flatMap((b) => [b.min, b.max, ...b.outlierEntries.map(o => o.value)]);
    const minVal = Math.min(...allVals);
    const maxVal = Math.max(...allVals);
    const { ticks, min: plotMin, max: plotMax } = getNiceTicks(minVal, maxVal);

    const colW = 100;
    const svgW = Math.max(boxplotByCategory.length * colW + 80, 300);
    const svgH = 400;
    const padT = 30;
    const padB = 50;
    const padL = 60;
    const plotH = svgH - padT - padB;
    const boxW = 40;

    const scaleY = (v: number) => {
      const denom = plotMax - plotMin;
      if (denom === 0) return padT + plotH / 2;
      return padT + plotH - ((v - plotMin) / denom) * plotH;
    };

    return (
      <svg width="100%" viewBox={`0 0 ${svgW} ${svgH}`} style={{ maxHeight: 420, margin: '0 auto', display: 'block' }}>
        {/* Grid lines */}
        {ticks.map((t) => (
          <line key={`grid-${t}`} x1={padL} y1={scaleY(t)} x2={svgW} y2={scaleY(t)} stroke="#eee" strokeWidth={1} />
        ))}
        {/* Y-axis */}
        <line x1={padL} y1={padT} x2={padL} y2={svgH - padB} stroke="#999" strokeWidth={1} />
        {ticks.map((t) => (
          <g key={t}>
            <line x1={padL - 4} y1={scaleY(t)} x2={padL} y2={scaleY(t)} stroke="#999" strokeWidth={1} />
            <text x={padL - 8} y={scaleY(t)} dy=".35em" textAnchor="end" fontSize={11} fill="#666">{formatBR(t, 1)}</text>
          </g>
        ))}
        {boxplotByCategory.map((bp, i) => {
          const cx = padL + 30 + i * colW + colW / 2;
          const color = COLORFUL[i % COLORFUL.length];
          return (
            <g key={i}>
              {/* Whiskers */}
              <line x1={cx} y1={scaleY(bp.whiskerLow)} x2={cx} y2={scaleY(bp.whiskerHigh)} stroke="#333" strokeWidth={1.5} />
              <line x1={cx - 12} y1={scaleY(bp.whiskerLow)} x2={cx + 12} y2={scaleY(bp.whiskerLow)} stroke="#333" strokeWidth={1.5} />
              <line x1={cx - 12} y1={scaleY(bp.whiskerHigh)} x2={cx + 12} y2={scaleY(bp.whiskerHigh)} stroke="#333" strokeWidth={1.5} />
              {/* Box */}
              <rect
                x={cx - boxW / 2}
                y={scaleY(bp.q3)}
                width={boxW}
                height={Math.max(scaleY(bp.q1) - scaleY(bp.q3), 1)}
                fill={color}
                stroke="#333"
                strokeWidth={1.5}
              />
              {/* Median */}
              <line x1={cx - boxW / 2} y1={scaleY(bp.q2)} x2={cx + boxW / 2} y2={scaleY(bp.q2)} stroke="#333" strokeWidth={2} />
              {/* Outliers */}
              {bp.outlierEntries.map((o, oi) => (
                <circle
                  key={`out-${oi}`}
                  cx={cx}
                  cy={scaleY(o.value)}
                  r={3.5}
                  fill="#fff"
                  stroke="#333"
                  strokeWidth={1}
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setHoveredOutlier({ value: o.value, id: o.id })}
                  onMouseLeave={() => setHoveredOutlier(null)}
                />
              ))}
              {/* Category label */}
              <text x={cx} y={svgH - padB + 15} textAnchor="middle" fontSize={11} fill="#333" fontWeight={500}>
                {bp.category}
              </text>
            </g>
          );
        })}
        {hoveredOutlier && (
          <text x={svgW - 10} y={padT - 10} textAnchor="end" fontSize={12} fill="#e03131" fontWeight={600}>
            Outlier ID: {hoveredOutlier.id} | Valor: {formatBR(hoveredOutlier.value, 2)}
          </text>
        )}
      </svg>
    );
  }, [boxplotByCategory, hoveredOutlier]);

  if (allCols.length < 2) {
    return <Text c="dimmed">São necessárias pelo menos 2 variáveis para análise bivariável.</Text>;
  }

  return (
    <Container fluid px={0}>
      <Grid gutter="lg">
        <Grid.Col span={{ base: 12, md: 3 }}>
          <Paper shadow="xs" p="md" withBorder>
            <Title order={5} mb="sm">Configurações</Title>
            {!(isFac1 && isFac2) && (
              <Checkbox
                label="Mostrar Medidas Resumo"
                checked={showMeasures}
                onChange={(e) => setShowMeasures(e.currentTarget.checked)}
                mb="md"
              />
            )}
            <Select
              label="Tipo de Gráfico"
              data={CHART_OPTIONS}
              value={chartType}
              onChange={(v) => v && setChartType(v as BiChartType)}
              mb="md"
            />
            {(chartType === 'barras_agrupadas' || chartType === 'barras_empilhadas') && isFac1 && isFac2 && (
              <>
                <SegmentedControl
                  fullWidth
                  size="xs"
                  color="cyan"
                  value={freqMode}
                  onChange={(v) => setFreqMode(v as FreqMode)}
                  data={[
                    { label: 'Absoluta', value: 'absoluta' },
                    { label: 'Percentual', value: 'percentual' },
                  ]}
                  mb="md"
                />
                <Checkbox
                  label="Mostrar Tabela de Contingência"
                  checked={showContingency}
                  onChange={(e) => setShowContingency(e.currentTarget.checked)}
                  mb="md"
                />
              </>
            )}
            <Select
              label="Variável 1"
              data={allCols.map((c) => ({ value: c, label: c }))}
              value={var1}
              onChange={(v) => v && setVar1(v)}
              searchable
              mb="md"
            />
            {isFac1 && customOrderVar1.length > 0 && (
              <>
                <Title order={6} mt="xs" mb="xs">Ordem de: {var1}</Title>
                <CategoryOrderControl 
                  order={customOrderVar1} 
                  hiddenCategories={hiddenVar1}
                  onChange={setCustomOrderVar1} 
                  onToggleHide={(cat) => setHiddenVar1(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat])}
                  useColors={false} 
                />
              </>
            )}
            <Select
              label="Variável 2"
              data={allCols.map((c) => ({ value: c, label: c }))}
              value={var2}
              onChange={(v) => v && setVar2(v)}
              searchable
              mb="md"
            />
            {isFac2 && customOrderVar2.length > 0 && (
              <>
                <Title order={6} mt="xs" mb="xs">Ordem de: {var2}</Title>
                <CategoryOrderControl 
                  order={customOrderVar2} 
                  hiddenCategories={hiddenVar2}
                  onChange={setCustomOrderVar2} 
                  onToggleHide={(cat) => setHiddenVar2(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat])}
                  useColors={(chartType === 'barras_agrupadas' || chartType === 'barras_empilhadas') && isFac1 && isFac2} 
                />
              </>
            )}
          </Paper>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 9 }}>
          {isInvalid ? (
            <Paper shadow="xs" p="md" withBorder>
              <Alert icon={<IconAlertTriangle size={16} />} title="Seleção Inválida" color="yellow">
                A combinação de variáveis selecionadas não é compatível com o gráfico "{CHART_OPTIONS.find(o => o.value === chartType)?.label}".
                {validCharts.length > 0 && (
                  <> Gráficos válidos para esta combinação: <strong>{validCharts.map(v => CHART_OPTIONS.find(o => o.value === v)?.label).join(', ')}</strong>.</>
                )}
              </Alert>
            </Paper>
          ) : (
            <>
              {/* Barras Agrupadas */}
              {chartType === 'barras_agrupadas' && isFac1 && isFac2 && ctable && (
                <Paper shadow="xs" p="md" withBorder mb="md">
                  <Group justify="space-between" mb="sm">
                    <Title order={5} ta="center">Gráfico de Barras Agrupadas</Title>
                    <Button variant="light" size="xs" leftSection={<IconDownload size={14} />} onClick={() => exportChartAsPNG(chartRef, `barras_agrupadas_${var1}_${var2}`)}>
                      Exportar PNG
                    </Button>
                  </Group>
                  <div ref={chartRef} style={{ width: '100%', height: 380 }}>
                    <ResponsiveContainer width="100%" height="100%">
                    <BarChart key={ctable.colLabels.join('-')} data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" interval={0} tick={<CustomXAxisTick />} height={110} label={{ value: var1, position: 'insideBottom', offset: -5, style: { fontSize: 13, fill: '#333' } }} />
                      <YAxis domain={freqMode === 'percentual' ? [0, 100] : ['auto', 'auto']} ticks={freqMode === 'percentual' ? [0, 25, 50, 75, 100] : undefined} allowDecimals={false} label={{ value: freqMode === 'percentual' ? 'Percentual (%)' : 'Frequência Absoluta', angle: -90, position: 'insideLeft', offset: -5, dy: 40, style: { fontSize: 13, fill: '#333' } }} />
                      <Tooltip formatter={(value: any, name: any) => [formatBR(Number(value), 1) + (freqMode === 'percentual' ? '% (do Total)' : ''), name]} />
                      <Legend verticalAlign="top" wrapperStyle={{ paddingBottom: 20 }} />
                      {ctable.colLabels.map((col, idx) => {
                        const originalIdx = customOrderVar2.indexOf(col);
                        const colorIdx = originalIdx !== -1 ? originalIdx : idx;
                        return (
                          <Bar key={col} dataKey={col} fill={COLORFUL[colorIdx % COLORFUL.length]} />
                        );
                      })}
                    </BarChart>
                  </ResponsiveContainer>
                  </div>
                </Paper>
              )}

              {/* Barras Empilhadas */}
              {chartType === 'barras_empilhadas' && isFac1 && isFac2 && ctable && (
                <Paper shadow="xs" p="md" withBorder mb="md">
                  <Group justify="space-between" mb="sm">
                    <Title order={5} ta="center">Gráfico de Barras Empilhadas</Title>
                    <Button variant="light" size="xs" leftSection={<IconDownload size={14} />} onClick={() => exportChartAsPNG(chartRef, `barras_empilhadas_${var1}_${var2}`)}>
                      Exportar PNG
                    </Button>
                  </Group>
                  <div ref={chartRef} style={{ width: '100%', height: 380 }}>
                    <ResponsiveContainer width="100%" height="100%">
                    <BarChart key={ctable.colLabels.join('-')} data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" interval={0} tick={<CustomXAxisTick />} height={110} label={{ value: var1, position: 'insideBottom', offset: -5, style: { fontSize: 13, fill: '#333' } }} />
                      <YAxis domain={freqMode === 'percentual' ? [0, 100] : ['auto', 'auto']} ticks={freqMode === 'percentual' ? [0, 25, 50, 75, 100] : undefined} allowDecimals={false} label={{ value: freqMode === 'percentual' ? 'Percentual (%)' : 'Frequência Absoluta', angle: -90, position: 'insideLeft', offset: -5, dy: 40, style: { fontSize: 13, fill: '#333' } }} />
                      <Tooltip formatter={(value: any, name: any) => [formatBR(Number(value), 1) + (freqMode === 'percentual' ? '%' : ''), name]} />
                      <Legend verticalAlign="top" wrapperStyle={{ paddingBottom: 20 }} />
                      {ctable.colLabels.map((col, idx) => {
                        const originalIdx = customOrderVar2.indexOf(col);
                        const colorIdx = originalIdx !== -1 ? originalIdx : idx;
                        return (
                          <Bar key={col} dataKey={col} stackId="a" fill={COLORFUL[colorIdx % COLORFUL.length]} />
                        );
                      })}
                    </BarChart>
                  </ResponsiveContainer>
                  </div>
                </Paper>
              )}

              {/* Contingency table */}
              {showContingency && (chartType === 'barras_agrupadas' || chartType === 'barras_empilhadas') && isFac1 && isFac2 && ctable && (
                <Paper shadow="xs" p="md" withBorder mb="md">
                  <Group justify="space-between" align="center" mb="sm">
                    <Title order={5}>Tabela de Contingência</Title>
                    <SegmentedControl
                      size="xs"
                      color="cyan"
                      value={percMode}
                      onChange={(v) => setPercMode(v as PercMode)}
                      data={[
                        { label: '% Linha', value: 'linha' },
                        { label: '% Coluna', value: 'coluna' },
                        { label: '% Geral', value: 'geral' },
                      ]}
                    />
                  </Group>
                  <div style={{ overflowX: 'auto' }}>
                    <Table striped highlightOnHover withTableBorder>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>{var1} \ {var2}</Table.Th>
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
                            {ctable.matrix[ri].map((val, ci) => {
                              let perc = 0;
                              if (percMode === 'linha' && ctable.rowTotals[ri] > 0) perc = (val / ctable.rowTotals[ri]) * 100;
                              else if (percMode === 'coluna' && ctable.colTotals[ci] > 0) perc = (val / ctable.colTotals[ci]) * 100;
                              else if (percMode === 'geral' && ctable.grandTotal > 0) perc = (val / ctable.grandTotal) * 100;
                              return (
                                <Table.Td key={ci}>
                                  {val} ({perc.toFixed(1)}%)
                                </Table.Td>
                              );
                            })}
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
              )}

              {/* Dispersão */}
              {chartType === 'dispersao' && isNum1 && isNum2 && (
                <Paper shadow="xs" p="md" withBorder mb="md">
                  <Group justify="space-between" mb="sm">
                    <Title order={5} ta="center">Diagrama de Dispersão</Title>
                    <Button variant="light" size="xs" leftSection={<IconDownload size={14} />} onClick={() => exportChartAsPNG(chartRef, `dispersao_${var1}_${var2}`)}>
                      Exportar PNG
                    </Button>
                  </Group>
                  <div ref={chartRef} style={{ width: '100%', height: 400 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart margin={{ top: 20, right: 30, left: 30, bottom: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="x" type="number" domain={['auto', 'auto']} name={var1} label={{ value: var1, position: 'insideBottom', offset: -10 }} height={60} />
                        <YAxis dataKey="y" type="number" domain={['auto', 'auto']} name={var2} label={{ value: var2, angle: -90, position: 'insideLeft', offset: -10 }} />
                        <Tooltip formatter={(value: number | string | undefined) => typeof value === 'number' ? formatBR(value, 2) : value} labelFormatter={() => ''} />
                        <Scatter name="Dados" data={scatterData} fill={DARK_CYAN}>
                          {scatterData.map((_, i) => (
                            <Cell key={i} fill={DARK_CYAN} />
                          ))}
                        </Scatter>
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                </Paper>
              )}

              {/* Boxplot por Categoria */}
              {chartType === 'boxplot_cat' && boxplotByCategory.length > 0 && (
                <Paper shadow="xs" p="md" withBorder mb="md">
                  <Group justify="space-between" mb="sm">
                    <Title order={5} ta="center">Boxplot de {numericVar} por {factorVar}</Title>
                    <Button variant="light" size="xs" leftSection={<IconDownload size={14} />} onClick={() => exportChartAsPNG(chartRef, `boxplot_${numericVar}_por_${factorVar}`)}>
                      Exportar PNG
                    </Button>
                  </Group>
                  <div ref={chartRef} style={{ width: '100%', height: 400 }}>
                    {renderVerticalMultiBoxplot()}
                  </div>
                </Paper>
              )}
              {chartType === 'boxplot_cat' && boxplotByCategory.length === 0 && (isFac1 !== isFac2) && (
                <Paper shadow="xs" p="md" withBorder>
                  <Text c="dimmed">Dados insuficientes ou categorias com &lt; 4 itens para gerar boxplots.</Text>
                </Paper>
              )}

              {/* Summary measures */}
              {showMeasures && measures && (
                <Paper shadow="xs" p="md" withBorder>
                  <Title order={5} mb="sm">Medidas Resumo</Title>
                  {measures.type === 'quant_quant' && (
                    <Table withTableBorder>
                      <Table.Tbody>
                        <Table.Tr><Table.Td fw={600}>n</Table.Td><Table.Td>{measures.n}</Table.Td></Table.Tr>
                        <Table.Tr><Table.Td fw={600}>Correlação de Pearson (r)</Table.Td><Table.Td>{formatBR(measures.pearson, 4)}</Table.Td></Table.Tr>
                        <Table.Tr><Table.Td fw={600}>Correlação de Spearman (ρ)</Table.Td><Table.Td>{formatBR(measures.spearman, 4)}</Table.Td></Table.Tr>
                      </Table.Tbody>
                    </Table>
                  )}
                  {measures.type === 'mixed' && (
                    <Table striped highlightOnHover withTableBorder>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>Categoria</Table.Th>
                          <Table.Th>n</Table.Th>
                          <Table.Th>Média</Table.Th>
                          <Table.Th>Mediana</Table.Th>
                          <Table.Th>Desvio Padrão</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {measures.cats.map((c) => (
                          <Table.Tr key={c.cat}>
                            <Table.Td fw={600}>{c.cat}</Table.Td>
                            <Table.Td>{c.n}</Table.Td>
                            <Table.Td>{formatBR(c.mean, 2)}</Table.Td>
                            <Table.Td>{formatBR(c.median, 2)}</Table.Td>
                            <Table.Td>{formatBR(c.sd, 2)}</Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  )}
                </Paper>
              )}
            </>
          )}
        </Grid.Col>
      </Grid>
    </Container>
  );
}
