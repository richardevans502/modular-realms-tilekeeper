import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { initTileKeeperDatabase } from '../../src/db/init';
import type { SavedLayoutRepository } from '../../src/db/savedLayoutRepository';
import { SaveLayoutModal, type SaveLayoutFormData } from '../../src/preview/SaveLayoutModal';

import { loadSeedCatalog } from '../../src/catalog/loadSeedCatalog';
import { useLayoutSolver } from '../../src/hooks/useLayoutSolver';
import {
  DEFAULT_LAYOUT_GOAL_FORM,
  LAYOUT_GOAL_REQUIRED_CATEGORIES,
  buildLayoutGoalRequest,
  buildSeed,
  deriveThemeOptions,
  getConstraintSummaries,
  hasAvailableInventory,
  incrementLayoutGoalNumber,
  toggleLayoutGoalCategory,
  toggleLayoutGoalTheme,
  updateLayoutGoalField,
  validateLayoutGoalForm,
  type LayoutGoalForm,
  type LayoutGoalRequest,
  type LayoutGoalRequiredCategory,
} from '../../src/layout/layoutGoalScreenModel';
import { suggestMissingTiles, type RequiredCategory } from '../../src/layout/missingTileSuggestions';
import { SolverInsightPanel } from '../../src/layout/SolverInsightPanel';
import { buildSolverInsightViewModel } from '../../src/layout/solverInsightViewModel';
import type { InventoryItem } from '../../src/shared/types';
import { tileKeeperTheme } from '../../src/ui/theme';

type LayoutGoalField = keyof LayoutGoalForm;

const catalog = loadSeedCatalog();
const themeOptions = deriveThemeOptions(catalog);
const demoInventory: InventoryItem[] = [
  {
    tile_type_id: 'mr-seed-1x1-floor-wood-cracked',
    owned_quantity: 2,
    condition: 'good',
    storage_location: 'demo tray',
  },
  {
    tile_type_id: 'mr-seed-1x1-door-wooden',
    owned_quantity: 1,
    condition: 'good',
    storage_location: 'demo tray',
  },
];

export default function LayoutGoalScreen() {
  const router = useRouter();
  const [form, setForm] = useState<LayoutGoalForm>(DEFAULT_LAYOUT_GOAL_FORM);
  const [generatedRequest, setGeneratedRequest] = useState<LayoutGoalRequest | null>(null);
  const [repository, setRepository] = useState<SavedLayoutRepository | null>(null);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const errors = validateLayoutGoalForm(form, demoInventory);
  const inventoryAvailable = hasAvailableInventory(demoInventory);
  const solverGoal = useMemo(
    () =>
      errors.length === 0
        ? {
            bounds: { width: Number(form.width), height: Number(form.height) },
            targetPlacements: Number(form.targetPlacements),
            seed: form.seed.trim(),
            goal: form.goal.trim(),
            themeTags: [...form.themeTags],
            requiredCategories: [...form.requiredCategories],
          }
        : null,
    [errors.length, form],
  );
  const {
    layouts,
    isLoading: isGenerating,
    error: solverError,
    generate: generateLayouts,
    cancel: cancelGeneration,
  } = useLayoutSolver({
    catalog,
    inventory: demoInventory,
    goal: solverGoal,
    options: { topN: 3, maxSearchNodes: 5000, timeoutMs: 1500 },
    onSolved: (layout) => {
      router.push({ pathname: '/preview', params: { layoutId: layout.id } });
    },
  });

  const solverInsight = useMemo(() => {
    const bestLayout = layouts[0];
    if (!generatedRequest || !bestLayout) {
      return null;
    }

    const suggestions = suggestMissingTiles({
      catalog,
      inventory: demoInventory,
      requiredCategories: buildSuggestionCategories(generatedRequest.requiredCategories, generatedRequest.targetPlacements),
      themeTags: generatedRequest.themeTags,
    });

    return buildSolverInsightViewModel({
      result: { ok: true, layout: bestLayout.layout, layouts, trace: bestLayout.trace },
      suggestions,
      inventory: demoInventory,
    });
  }, [generatedRequest, layouts]);

  function setField(field: LayoutGoalField, value: string) {
    setForm((current) => updateLayoutGoalField(current, field, value));
    setGeneratedRequest(null);
  }

  function adjustNumber(field: 'width' | 'height' | 'targetPlacements', delta: number) {
    setForm((current) => incrementLayoutGoalNumber(current, field, delta));
    setGeneratedRequest(null);
  }

  function toggleTheme(themeTag: string) {
    setForm((current) => toggleLayoutGoalTheme(current, themeTag));
    setGeneratedRequest(null);
  }

  function toggleCategory(category: LayoutGoalRequiredCategory) {
    setForm((current) => toggleLayoutGoalCategory(current, category));
    setGeneratedRequest(null);
  }

  function randomiseSeed() {
    setForm((current) => ({ ...current, seed: buildSeed() }));
    setGeneratedRequest(null);
  }

  async function generate() {
    if (errors.length > 0 || isGenerating) {
      return;
    }

    const request = buildLayoutGoalRequest(form, new Date().toISOString());
    setGeneratedRequest(request);
    await generateLayouts();
  }

  useEffect(() => {
    let mounted = true;
    void initTileKeeperDatabase().then((persistence) => {
      if (mounted) {
        setRepository(persistence.savedLayoutRepository);
      }
    });
    return () => { mounted = false; };
  }, []);

  async function handleSaveLayout(data: SaveLayoutFormData): Promise<void> {
    if (!repository) {
      throw new Error('Database not ready');
    }
    const bestLayout = layouts[0]?.layout;
    if (!bestLayout) {
      throw new Error('No layout available to save');
    }
    const savedLayout = {
      id: `saved-${bestLayout.id}-${Date.now()}`,
      name: data.name,
      layout: bestLayout,
      tags: data.tags,
      favourite: data.favourite,
      notes: data.notes || undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await repository.createLayout(savedLayout);
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Layout Goal</Text>
        <Text style={styles.title}>Set bounds, constraints, seed, generate</Text>
        <Text style={styles.subtitle}>
          Configure the solver request before handing it to the layout engine. Width and height are bounded at 2–20 cells, target count is 4–50 tiles, and theme/category constraints come from the catalog ritual.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Table bounds</Text>
        <View style={styles.fieldRow}>
          <Stepper label="Width" value={form.width} suffix="cells" onChangeText={(value) => setField('width', value)} onDecrement={() => adjustNumber('width', -1)} onIncrement={() => adjustNumber('width', 1)} />
          <Stepper label="Height" value={form.height} suffix="cells" onChangeText={(value) => setField('height', value)} onDecrement={() => adjustNumber('height', -1)} onIncrement={() => adjustNumber('height', 1)} />
        </View>
        <Text style={styles.helperText}>Allowed table size: 2 × 2 through 20 × 20 grid cells.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Target tile count</Text>
        <Stepper label="Target tile count" value={form.targetPlacements} suffix="tiles" onChangeText={(value) => setField('targetPlacements', value)} onDecrement={() => adjustNumber('targetPlacements', -1)} onIncrement={() => adjustNumber('targetPlacements', 1)} />
        <View style={styles.sliderTrack} accessibilityLabel="Target tile count slider range 4 to 50">
          <View style={[styles.sliderFill, { width: `${targetFillPercent(form.targetPlacements)}%` }]} />
        </View>
        <Text style={styles.helperText}>Slider range: 4–50 tiles. Use the stepper to tune the exact count.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Theme selector</Text>
        <View style={styles.chipWrap}>
          {themeOptions.map((themeTag) => (
            <Chip key={themeTag} label={themeTag} selected={form.themeTags.includes(themeTag)} onPress={() => toggleTheme(themeTag)} />
          ))}
        </View>
        <Text style={styles.helperText}>Pick any number of catalog theme tags, or leave blank to allow every theme.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Required categories</Text>
        <View style={styles.chipWrap}>
          {LAYOUT_GOAL_REQUIRED_CATEGORIES.map((category) => (
            <CheckboxChip key={category} label={category} selected={form.requiredCategories.includes(category)} onPress={() => toggleCategory(category)} />
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Seed</Text>
        <View style={styles.seedRow}>
          <Field label="Seed" value={form.seed} onChangeText={(value) => setField('seed', value)} />
          <TouchableOpacity accessibilityLabel="Randomise seed" accessibilityRole="button" onPress={randomiseSeed} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Randomise</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.label}>Goal brief</Text>
        <TextInput
          accessibilityLabel="Goal brief"
          multiline
          onChangeText={(value) => setField('goal', value)}
          placeholder="Describe the layout you want."
          placeholderTextColor={tileKeeperTheme.colours.mutedText}
          style={[styles.input, styles.goalInput]}
          value={form.goal}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Constraint summary</Text>
        <View style={styles.summaryBox}>
          {getConstraintSummaries(form).map((summary) => (
            <Text key={summary} style={styles.summaryText}>• {summary}</Text>
          ))}
        </View>
      </View>

      {errors.length > 0 ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>{inventoryAvailable ? 'Fix before generate' : 'Inventory needed'}</Text>
          {errors.map((error) => (
            <Text key={error} style={styles.errorText}>• {error}</Text>
          ))}
        </View>
      ) : null}

      {solverError ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>Solver failed</Text>
          <Text style={styles.errorText}>{solverError}</Text>
        </View>
      ) : null}

      <TouchableOpacity
        accessibilityLabel="Generate layout goal"
        accessibilityRole="button"
        accessibilityState={{ busy: isGenerating, disabled: errors.length > 0 || isGenerating }}
        onPress={errors.length > 0 || isGenerating ? undefined : generate}
        style={[styles.generateButton, errors.length > 0 || isGenerating ? styles.generateButtonDisabled : null]}
      >
        <Text style={styles.generateText}>{isGenerating ? 'Generating layout…' : 'Generate'}</Text>
      </TouchableOpacity>

      {isGenerating ? (
        <TouchableOpacity accessibilityLabel="Cancel layout generation" accessibilityRole="button" onPress={cancelGeneration} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Cancel generation</Text>
        </TouchableOpacity>
      ) : null}

      {isGenerating ? <Text style={styles.loadingText}>Summoning solver candidates from the tile vault…</Text> : null}

      <View style={styles.generatedCard}>
        <Text style={styles.sectionTitle}>Generated request</Text>
        {generatedRequest ? (
          <>
            <Text style={styles.generatedMetric}>{generatedRequest.bounds.width} × {generatedRequest.bounds.height} grid · {generatedRequest.targetPlacements} tiles</Text>
            <Text style={styles.generatedText}>Themes: {generatedRequest.themeTags.length > 0 ? generatedRequest.themeTags.join(', ') : 'any'}</Text>
            <Text style={styles.generatedText}>Categories: {generatedRequest.requiredCategories.join(', ')}</Text>
            <Text style={styles.generatedText}>Seed: {generatedRequest.seed}</Text>
            <Text style={styles.generatedText}>Goal: {generatedRequest.goal}</Text>
          </>
        ) : (
          <Text style={styles.generatedText}>No request generated yet. Tune the ritual, then press Generate.</Text>
        )}
      </View>

      {solverInsight ? <SolverInsightPanel model={solverInsight} /> : null}

      {layouts.length > 0 && repository ? (
        <TouchableOpacity
          accessibilityLabel="Save generated layout to library"
          accessibilityRole="button"
          onPress={() => setSaveModalOpen(true)}
          style={styles.secondaryButton}
        >
          <Text style={styles.secondaryButtonText}>Save generated layout to library</Text>
        </TouchableOpacity>
      ) : null}

      {saveStatus === 'saved' ? <Text style={styles.saveStatus}>✓ Saved</Text> : null}
      {saveStatus === 'error' ? <Text style={styles.saveError}>Save failed</Text> : null}

      <SaveLayoutModal
        visible={saveModalOpen}
        initialName={form.goal}
        onCancel={() => setSaveModalOpen(false)}
        onSave={async (data) => {
          setSaveModalOpen(false);
          setSaveStatus('saving');
          try {
            await handleSaveLayout(data);
            setSaveStatus('saved');
          } catch {
            setSaveStatus('error');
          }
        }}
      />
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

interface StepperProps extends FieldProps {
  onDecrement: () => void;
  onIncrement: () => void;
}

function Stepper({ label, value, suffix, onChangeText, onDecrement, onIncrement }: StepperProps) {
  return (
    <View style={styles.stepper}>
      <Field label={label} value={value} suffix={suffix} onChangeText={onChangeText} />
      <View style={styles.stepperButtons}>
        <TouchableOpacity accessibilityLabel={`Decrease ${label}`} accessibilityRole="button" onPress={onDecrement} style={styles.stepperButton}>
          <Text style={styles.stepperButtonText}>−</Text>
        </TouchableOpacity>
        <TouchableOpacity accessibilityLabel={`Increase ${label}`} accessibilityRole="button" onPress={onIncrement} style={styles.stepperButton}>
          <Text style={styles.stepperButtonText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity accessibilityLabel={`Theme ${label}`} accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress} style={[styles.chip, selected ? styles.chipSelected : null]}>
      <Text style={[styles.chipText, selected ? styles.chipTextSelected : null]}>{label}</Text>
    </TouchableOpacity>
  );
}

function CheckboxChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity accessibilityLabel={`Required category ${label}`} accessibilityRole="checkbox" accessibilityState={{ checked: selected }} onPress={onPress} style={[styles.chip, selected ? styles.chipSelected : null]}>
      <Text style={[styles.chipText, selected ? styles.chipTextSelected : null]}>{selected ? '☑' : '☐'} {label}</Text>
    </TouchableOpacity>
  );
}

function targetFillPercent(value: string): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.min(100, ((numeric - 4) / 46) * 100));
}

function buildSuggestionCategories(categories: LayoutGoalRequiredCategory[], targetPlacements: number): RequiredCategory[] {
  const tileCategories = categories.filter(
    (category): category is Exclude<LayoutGoalRequiredCategory, 'corridor'> => category !== 'corridor',
  );
  const quantity = Math.max(1, Math.ceil(targetPlacements / Math.max(1, categories.length)));
  return tileCategories.map((category) => ({ category, quantity }));
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
  helperText: { color: tileKeeperTheme.colours.mutedText, fontSize: 13, lineHeight: 18 },
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
  stepper: { flex: 1, gap: tileKeeperTheme.spacing.sm },
  stepperButtons: { flexDirection: 'row', gap: tileKeeperTheme.spacing.sm },
  stepperButton: {
    alignItems: 'center',
    backgroundColor: tileKeeperTheme.colours.frame,
    borderColor: tileKeeperTheme.colours.secondary,
    borderRadius: tileKeeperTheme.radius.button,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: tileKeeperTheme.touch.minimum,
  },
  stepperButtonText: { color: tileKeeperTheme.colours.secondaryBright, fontSize: 24, fontWeight: '900' },
  sliderTrack: {
    backgroundColor: tileKeeperTheme.colours.raisedSurface,
    borderRadius: 999,
    height: 14,
    overflow: 'hidden',
  },
  sliderFill: { backgroundColor: tileKeeperTheme.colours.secondaryBright, height: '100%' },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: tileKeeperTheme.spacing.sm },
  chip: {
    backgroundColor: tileKeeperTheme.colours.raisedSurface,
    borderColor: tileKeeperTheme.colours.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: tileKeeperTheme.spacing.md,
    paddingVertical: tileKeeperTheme.spacing.sm,
  },
  chipSelected: {
    backgroundColor: tileKeeperTheme.colours.primary,
    borderColor: tileKeeperTheme.colours.secondaryBright,
  },
  chipText: { color: tileKeeperTheme.colours.text, fontWeight: '800' },
  chipTextSelected: { color: tileKeeperTheme.colours.onFrame },
  seedRow: { alignItems: 'flex-end', flexDirection: 'row', gap: tileKeeperTheme.spacing.md },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: tileKeeperTheme.colours.frame,
    borderColor: tileKeeperTheme.colours.secondaryBright,
    borderRadius: tileKeeperTheme.radius.button,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: tileKeeperTheme.touch.preferredButtonHeight,
    paddingHorizontal: tileKeeperTheme.spacing.lg,
  },
  secondaryButtonText: { color: tileKeeperTheme.colours.secondaryBright, fontWeight: '900' },
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
    borderColor: tileKeeperTheme.colours.secondaryBright,
    borderRadius: tileKeeperTheme.radius.button,
    borderWidth: 2,
    justifyContent: 'center',
    minHeight: tileKeeperTheme.touch.preferredButtonHeight + 8,
  },
  generateButtonDisabled: { backgroundColor: tileKeeperTheme.colours.mutedText, borderColor: tileKeeperTheme.colours.border },
  generateText: { color: tileKeeperTheme.colours.onFrame, fontSize: 18, fontWeight: '900' },
  loadingText: { color: tileKeeperTheme.colours.primary, fontSize: 15, fontWeight: '900', textAlign: 'center' },
  generatedCard: {
    backgroundColor: tileKeeperTheme.colours.frame,
    borderColor: tileKeeperTheme.colours.secondary,
    borderRadius: tileKeeperTheme.radius.card,
    borderWidth: 1,
    gap: tileKeeperTheme.spacing.sm,
    padding: tileKeeperTheme.spacing.lg,
  },
  generatedMetric: { color: tileKeeperTheme.colours.secondaryBright, fontSize: 18, fontWeight: '900' },
  generatedText: { color: tileKeeperTheme.colours.onFrame, fontSize: 14, lineHeight: 20 },
  saveStatus: {
    color: '#22c55e',
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 8,
  },
  saveError: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 8,
  },
});
