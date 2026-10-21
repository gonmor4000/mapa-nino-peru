import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { colors, ui } from '@/ui/theme';

type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
};

export function Button({ title, onPress, variant = 'secondary', disabled }: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        variant === 'primary' && styles.primary,
        variant === 'danger' && styles.danger,
        (pressed || disabled) && { opacity: 0.6 },
      ]}>
      <Text
        style={[
          styles.buttonText,
          variant === 'primary' && { color: '#FFFFFF' },
          variant === 'danger' && { color: colors.danger },
        ]}>
        {title}
      </Text>
    </Pressable>
  );
}

type FieldProps = Omit<TextInputProps, 'value' | 'onChangeText'> & {
  label: string;
  value: string;
  /** Called when the field loses focus, so typing does not write to the database on every key. */
  onSave: (value: string) => void;
};

export function Field({ label, value, onSave, style, ...rest }: FieldProps) {
  const [draft, setDraft] = useState(value);
  const [saved, setSaved] = useState(value);
  // Pick up a new stored value (e.g. after a reload) without an effect.
  if (value !== saved) {
    setSaved(value);
    setDraft(value);
  }
  return (
    <View style={{ flex: 1, minWidth: 200 }}>
      <Text style={ui.label}>{label}</Text>
      <TextInput
        {...rest}
        style={[ui.input, style]}
        value={draft}
        onChangeText={setDraft}
        onBlur={() => draft !== value && onSave(draft)}
      />
    </View>
  );
}

type ChoiceProps<T extends string> = {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
};

export function Choice<T extends string>({ label, value, options, onChange }: ChoiceProps<T>) {
  return (
    <View>
      <Text style={ui.label}>{label}</Text>
      <View style={[ui.row, { flexWrap: 'wrap' }]}>
        {options.map((o) => {
          const selected = o.value === value;
          return (
            <Pressable
              key={o.value}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => onChange(o.value)}
              style={[styles.chip, selected && styles.chipSelected]}>
              <Text style={[styles.chipText, selected && { color: colors.accent, fontWeight: '600' }]}>{o.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  primary: { backgroundColor: colors.accent, borderColor: colors.accent },
  danger: { borderColor: colors.danger },
  buttonText: { fontSize: 15, fontWeight: '600', color: colors.accent },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipSelected: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  chipText: { fontSize: 14, color: colors.text },
});
