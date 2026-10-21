import { StyleSheet } from 'react-native';

export const colors = {
  background: '#F4F5F7',
  surface: '#FFFFFF',
  text: '#1B1F24',
  muted: '#5F6670',
  border: '#D9DCE1',
  accent: '#1F4E79',
  accentSoft: '#E3ECF5',
  danger: '#B3261E',
};

export const ui = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, gap: 16, maxWidth: 900, width: '100%', alignSelf: 'center' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: 16,
    gap: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: colors.text },
  label: { fontSize: 13, color: colors.muted, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  muted: { color: colors.muted },
});
