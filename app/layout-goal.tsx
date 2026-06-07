import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { loadSeedCatalog } from '../src/catalog/loadSeedCatalog';
import {
  DEFAULT_LAYOUT_GOAL_FORM,
  buildLayoutGoalRequest,
  getConstraintSummaries,
  updateLayoutGoalField,
  validateLayoutGoalForm,
  type LayoutGoalForm,
  type LayoutGoalRequest,
} from '../src/layout/layoutGoalScreenModel';
import { solveLayoutFromInventory } from '../src/layout/layoutSolver';
import { suggestMissingTiles } from '../src/layout/missingTileSuggestions';
import { SolverInsightPanel } from '../src/layout/SolverInsightPanel';
import { buildSolverInsightViewModel } from '../src/layout/solverInsightViewModel';
import type { InventoryItem } from '../src/shared/types';
import { tileKeeperTheme } from '../src/ui/theme';

type LayoutGoalField = keyof LayoutGoalForm;

const catalog = loadSeedCatalog();
const demoInventory: InventoryItem[] = [
  {
    tile_type_id: 'mr-seed-1x1-floor-wood-cracked',
    owned_quantity: 2,
    reserved: 0,
    condition: 'good',
    storage_location: 'demo tray',
  },
  {
    tile_type_id: 'mr-seed-1x1-door-wooden',
    owned_quantity: 1,
    reserved: 0,
    condition: 'good',
    storage_location: 'demo tray',
  },
];

export default function LayoutGoalScreen() {
  const [form, setForm] = useState<LayoutGoalForm>(DEFAULT_LAYOUT_GOAL_FORM);
  const [generatedRequest, setGeneratedRequest] = useState<LayoutGoalRequest | null>(null);
  const errors = validateLayoutGoalForm(form);

  const solverInsight = useMemo(() => {
    if (!generatedRequest) {
      return null;
    }

    const result = solveLayoutFromInventory({
      catalog,
      inventory: demoInventory,
      bounds: generatedRequest.bounds,
      targetPlacements: generatedRequest.targetPlacements,
      seed: generatedRequest.seed,
      goal: generatedRequest.goal,
      createdAt: generatedRequest.createdAt,
    });

    const suggestions = suggestMissingTiles({
      catalog,
      inventory: demoInventory,
      requiredCategories: [{ category: 'floor', quantity: generatedRequest.targetPlacements }],
      themeTags: generatedRequest.goal.toLowerCase().split(/\W+/).filter(Boolean),
    });

    return buildSolverInsightViewModel({ result, suggestions, inventory: demoInventory });
  }, [generatedRequest]);

  function setField(field: LayoutGoalField, value: string) {
    setForm((current) => updateLayoutGoalField(current, field, value));
    setGeneratedRequest(null);
  }

  function generate() {
    if (errors.length > 0) {
      return;
    }

    setGeneratedRequest(buildLayoutGoalRequest(form, new Date().toISOString()));
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Layout Goal</Text>
        <Text style={styles.title}>Set bounds, constraints, seed, generate</Text>
        <Text style={styles.subtitle}>
          Configure the solver request before handing it to the layout engine. Numeric fields are normalised, validation is shown before generation, and the generated request feeds the solver insight panel.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Bounds</Text>
        <View style={styles.fieldRow}>
          <Field label="Width" value={form.width} suffix="cells" onChangeText={(value) => setField('width', value)} />
          <Field label="Height" value={form.height} suffix="cells" onChangeText={(value) => setField('height', value)} />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Constraints</Text>
        <Field
          label="Target placements"
          value={form.targetPlacements}
          suffix="tiles"
          onChangeText={(value) => setField('targetPlacements', value)}
        />
        <View style={styles.summaryBox}>
          {getConstraintSummaries(form).map((summary) => (
            <Text key={summary} style={styles.summaryText}>• {summary}</Text>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Seed & Goal</Text>
        <Field label="Seed" value={form.seed} onChangeText={(value) => setField('seed', value)} />
        <Text style={styles.label}>Goal brief</Text>
        <TextInput
          accessibilityLabel="Goal brief"
          onChangeText={(value) => setField('goal', value)}
          placeholder="Describe the layout you want."
          placeholderTextColor={tileKeeperTheme.colours.mutedText}
          style={[styles.input, styles.goalInput]}
          value={form.goal}
        />
      </View>

      {errors.length > 0 ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>Fix before generate</Text>
          {errors.map((error) => (
            <Text key={error} style={styles.errorText}>• {error}</Text>
          ))}
        </View>
      ) : null}

      <TouchableOpacity
        accessibilityLabel="Generate layout goal"
        accessibilityRole="button"
        accessibilityState={{ disabled: errors.length > 0 }}
        onPress={errors.length > 0 ? undefined : generate}
        style={[styles.generateButton, errors.length > 0 ? styles.generateButtonDisabled : null]}
      >
        <Text style={styles.generateText}>Generate</Text>
      </TouchableOpacity>

      <View style={styles.generatedCard}>
        <Text style={styles.sectionTitle}>Generated request</Text>
        {generatedRequest ? (
          <>
            <Text style={styles.generatedMetric}>{generatedRequest.bounds.width} × {generatedRequest.bounds.height} grid · {generatedRequest.targetPlacements} tiles</Text>
            <Text style={styles.generatedText}>Seed: {generatedRequest.seed}</Text>
            <Text style={styles.generatedText}>Goal: {generatedRequest.goal}</Text>
          </>
        ) : (
          <Text style={styles.generatedText}>No request generated yet. Tune the ritual, then press Generate.</Text>
        )}
      </View>

      {solverInsight ? <SolverInsightPanel model={solverInsight} /> : null}
    </ScrollView>
  );
}

interface FieldProps {
  label: string;
  value: string;
  suffix?: string;
  onChangeText: (value: string) => void;
}

function Field({ label, value, suffix, onChangeText }: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputRow}>
        <TextInput
          accessibilityLabel={label}
          onChangeText={onChangeText}
          placeholderTextColor={tileKeeperTheme.colours.mutedText}
          style={styles.input}
          value={value}
        />
        {suffix ? <Text style={styles.suffix}>{suffix}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: tileKeeperTheme.colours.background,
    gap: tileKeeperTheme.spacing.lg,
    minHeight: '100%',
    padding: tileKeeperTheme.spacing.lg,
  },
  header: { gap: tileKeeperTheme.spacing.xs },
  eyebrow: {
    color: tileKeeperTheme.colours.primary,
    fontWeight: '900',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  title: { color: tileKeeperTheme.colours.text, fontSize: 32, fontWeight: '900' },
  subtitle: { color: tileKeeperTheme.colours.mutedText, fontSize: 16, lineHeight: 23 },
  card: {
    backgroundColor: tileKeeperTheme.colours.surface,
    borderColor: tileKeeperTheme.colours.border,
    borderRadius: tileKeeperTheme.radius.card,
    borderWidth: 1,
    gap: tileKeeperTheme.spacing.md,
    padding: tileKeeperTheme.spacing.lg,
  },
  sectionTitle: { color: tileKeeperTheme.colours.text, fontSize: 21, fontWeight: '900' },
  fieldRow: { flexDirection: 'row', gap: tileKeeperTheme.spacing.md },
  field: { flex: 1, gap: tileKeeperTheme.spacing.xs },
  label: { color: tileKeeperTheme.colours.mutedText, fontSize: 14, fontWeight: '800' },
  inputRow: { alignItems: 'center', flexDirection: 'row', gap: tileKeeperTheme.spacing.sm },
  input: {
    backgroundColor: tileKeeperTheme.colours.raisedSurface,
    borderColor: tileKeeperTheme.colours.border,
    borderRadius: tileKeeperTheme.radius.input,
    borderWidth: 1,
    color: tileKeeperTheme.colours.text,
    flex: 1,
    fontSize: 16,
    minHeight: tileKeeperTheme.touch.preferredButtonHeight,
    paddingHorizontal: tileKeeperTheme.spacing.md,
    paddingVertical: tileKeeperTheme.spacing.sm,
  },
  goalInput: { minHeight: 104, textAlignVertical: 'top' },
  suffix: { color: tileKeeperTheme.colours.mutedText, fontWeight: '800' },
  summaryBox: {
    backgroundColor: tileKeeperTheme.colours.raisedSurface,
    borderRadius: tileKeeperTheme.radius.card,
    gap: tileKeeperTheme.spacing.xs,
    padding: tileKeeperTheme.spacing.md,
  },
  summaryText: { color: tileKeeperTheme.colours.text, fontSize: 14, lineHeight: 20 },
  errorCard: {
    backgroundColor: '#FFF1EA',
    borderColor: tileKeeperTheme.colours.danger,
    borderRadius: tileKeeperTheme.radius.card,
    borderWidth: 1,
    gap: tileKeeperTheme.spacing.xs,
    padding: tileKeeperTheme.spacing.md,
  },
  errorTitle: { color: tileKeeperTheme.colours.danger, fontSize: 16, fontWeight: '900' },
  errorText: { color: tileKeeperTheme.colours.text, fontSize: 14, lineHeight: 20 },
  generateButton: {
    alignItems: 'center',
    backgroundColor: tileKeeperTheme.colours.primary,
    borderRadius: tileKeeperTheme.radius.button,
    justifyContent: 'center',
    minHeight: tileKeeperTheme.touch.preferredButtonHeight,
  },
  generateButtonDisabled: { backgroundColor: tileKeeperTheme.colours.mutedText },
  generateText: { color: tileKeeperTheme.colours.onFrame, fontSize: 16, fontWeight: '900', letterSpacing: 0.8, textTransform: 'uppercase' },
  generatedCard: {
    backgroundColor: tileKeeperTheme.colours.surface,
    borderLeftColor: tileKeeperTheme.colours.success,
    borderLeftWidth: 5,
    borderRadius: tileKeeperTheme.radius.card,
    gap: tileKeeperTheme.spacing.sm,
    padding: tileKeeperTheme.spacing.lg,
  },
  generatedMetric: { color: tileKeeperTheme.colours.primary, fontSize: 18, fontWeight: '900' },
  generatedText: { color: tileKeeperTheme.colours.text, fontSize: 15, lineHeight: 22 },
});
