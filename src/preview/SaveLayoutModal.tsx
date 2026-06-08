import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { tileKeeperTheme } from '../ui/theme';

export interface SaveLayoutFormData {
  name: string;
  tags: string[];
  notes: string;
  favourite: boolean;
}

export interface SaveLayoutModalProps {
  visible: boolean;
  initialName?: string;
  initialTags?: string[];
  initialNotes?: string;
  initialFavourite?: boolean;
  onSave: (data: SaveLayoutFormData) => void;
  onCancel: () => void;
}

export function SaveLayoutModal({
  visible,
  initialName = '',
  initialTags = [],
  initialNotes = '',
  initialFavourite = false,
  onSave,
  onCancel,
}: SaveLayoutModalProps) {
  const [name, setName] = useState(initialName);
  const [tagsText, setTagsText] = useState(initialTags.join(', '));
  const [notes, setNotes] = useState(initialNotes);
  const [favourite, setFavourite] = useState(initialFavourite);

  React.useEffect(() => {
    if (visible) {
      setName(initialName);
      setTagsText(initialTags.join(', '));
      setNotes(initialNotes);
      setFavourite(initialFavourite);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  function handleSave() {
    const tags = tagsText
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    onSave({ name: name.trim() || 'Untitled layout', tags, notes: notes.trim(), favourite });
  }

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <Text style={styles.title}>Save Layout</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              accessibilityLabel="Layout name"
              placeholder="e.g. Castle Dungeon Room 3"
              placeholderTextColor={tileKeeperTheme.colours.mutedText}
              value={name}
              onChangeText={setName}
              style={styles.input}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Tags (comma-separated)</Text>
            <TextInput
              accessibilityLabel="Layout tags"
              placeholder="campaign, dungeon, boss fight"
              placeholderTextColor={tileKeeperTheme.colours.mutedText}
              value={tagsText}
              onChangeText={setTagsText}
              style={styles.input}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Notes</Text>
            <TextInput
              accessibilityLabel="Layout notes"
              multiline
              placeholder="Optional notes…"
              placeholderTextColor={tileKeeperTheme.colours.mutedText}
              value={notes}
              onChangeText={setNotes}
              style={[styles.input, styles.notesInput]}
            />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.label}>Favourite</Text>
            <Switch
              accessibilityLabel="Favourite"
              trackColor={{ false: tileKeeperTheme.colours.border, true: tileKeeperTheme.colours.secondaryBright }}
              thumbColor={favourite ? tileKeeperTheme.colours.primary : '#f4f3f4'}
              value={favourite}
              onValueChange={setFavourite}
            />
          </View>

          <View style={styles.buttonRow}>
            <Pressable accessibilityRole="button" onPress={onCancel} style={[styles.button, styles.cancelButton]}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={handleSave} style={[styles.button, styles.saveButton]}>
              <Text style={styles.saveText}>Save to Library</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: tileKeeperTheme.colours.surface,
    borderColor: tileKeeperTheme.colours.secondaryBright,
    borderRadius: tileKeeperTheme.radius.sheet,
    borderWidth: 2,
    gap: tileKeeperTheme.spacing.md,
    padding: tileKeeperTheme.spacing.xl,
  },
  title: {
    color: tileKeeperTheme.colours.primary,
    fontSize: 26,
    fontWeight: '900',
    marginBottom: 4,
  },
  field: {
    gap: tileKeeperTheme.spacing.xs,
  },
  label: {
    color: tileKeeperTheme.colours.mutedText,
    fontSize: 14,
    fontWeight: '800',
  },
  input: {
    backgroundColor: tileKeeperTheme.colours.raisedSurface,
    borderColor: tileKeeperTheme.colours.border,
    borderRadius: tileKeeperTheme.radius.input,
    borderWidth: 1,
    color: tileKeeperTheme.colours.text,
    fontSize: 16,
    minHeight: tileKeeperTheme.touch.preferredButtonHeight,
    paddingHorizontal: tileKeeperTheme.spacing.md,
    paddingVertical: tileKeeperTheme.spacing.sm,
  },
  notesInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  switchRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  button: {
    alignItems: 'center',
    borderRadius: tileKeeperTheme.radius.button,
    flex: 1,
    justifyContent: 'center',
    minHeight: tileKeeperTheme.touch.preferredButtonHeight,
    paddingHorizontal: tileKeeperTheme.spacing.lg,
  },
  cancelButton: {
    backgroundColor: tileKeeperTheme.colours.raisedSurface,
    borderColor: tileKeeperTheme.colours.border,
    borderWidth: 1,
  },
  cancelText: {
    color: tileKeeperTheme.colours.text,
    fontWeight: '900',
  },
  saveButton: {
    backgroundColor: tileKeeperTheme.colours.primary,
    borderColor: tileKeeperTheme.colours.secondaryBright,
    borderWidth: 2,
  },
  saveText: {
    color: tileKeeperTheme.colours.onFrame,
    fontWeight: '900',
  },
});
