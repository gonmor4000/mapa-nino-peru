import { Image } from 'expo-image';
import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';

import {
  addActor,
  addLevel,
  deleteActor,
  deleteProject,
  getProject,
  listActors,
  listLevels,
  updateActor,
  updateProject,
} from '@/db/repo';
import { exportAndShare } from '@/export/share';
import {
  ACTOR_ROLES,
  DEFAULT_LEVEL_NAMES,
  REPORT_MODES,
  type Actor,
  type BuildingType,
  type Level,
  type Project,
} from '@/model/types';
import { projectFile } from '@/storage/files';
import { Button, Choice, Field } from '@/ui/controls';
import { colors, ui } from '@/ui/theme';

export default function ProjectScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const [project, setProject] = useState<Project | null>(null);
  const [actors, setActors] = useState<Actor[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [exporting, setExporting] = useState(false);

  const reload = useCallback(async () => {
    const [p, a, l] = await Promise.all([getProject(db, id), listActors(db, id), listLevels(db, id)]);
    setProject(p);
    setActors(a);
    setLevels(l);
  }, [db, id]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  if (!project) return <ActivityIndicator style={{ marginTop: 32 }} />;

  const save = async (fields: Partial<Project>) => {
    await updateProject(db, id, fields);
    await reload();
  };

  const onAddLevel = async () => {
    const used = new Set(levels.map((l) => l.name));
    const name = DEFAULT_LEVEL_NAMES.find((n) => !used.has(n)) ?? `Niveau ${levels.length + 1}`;
    const levelId = await addLevel(db, id, name);
    router.push({ pathname: '/level/[id]', params: { id: levelId } });
  };

  const onExport = async () => {
    setExporting(true);
    try {
      await exportAndShare(db, id);
    } catch (e) {
      Alert.alert('Export impossible', e instanceof Error ? e.message : String(e));
    } finally {
      setExporting(false);
    }
  };

  const onDelete = () =>
    Alert.alert('Supprimer ce DTG ?', 'Le projet ne sera plus affiché.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          await deleteProject(db, id);
          router.back();
        },
      },
    ]);

  return (
    <ScrollView style={ui.screen} contentContainerStyle={ui.content} keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: project.name }} />

      <View style={ui.card}>
        <Text style={ui.sectionTitle}>Copropriété</Text>
        <Field label="Nom" value={project.name} onSave={(name) => save({ name })} />
        <Field label="Adresse" value={project.address} onSave={(address) => save({ address })} />
        <View style={[ui.row, { flexWrap: 'wrap', gap: 12 }]}>
          <Field label="N° dossier" value={project.file_number} onSave={(file_number) => save({ file_number })} />
          <Field
            label="Année de construction"
            value={project.construction_year}
            keyboardType="number-pad"
            onSave={(construction_year) => save({ construction_year })}
          />
          <Field
            label="Nombre de lots"
            value={project.lot_count}
            keyboardType="number-pad"
            onSave={(lot_count) => save({ lot_count })}
          />
        </View>
        <Field
          label="Date(s) de visite"
          value={project.visit_dates}
          placeholder="ex. 12 et 19 mars 2026"
          onSave={(visit_dates) => save({ visit_dates })}
        />
        <Choice<BuildingType>
          label="Type de bâtiment"
          value={project.building_type}
          options={[
            { value: 'ancien', label: 'Ancien' },
            { value: 'moderne', label: 'Moderne' },
          ]}
          onChange={(building_type) => save({ building_type, report_mode: building_type })}
        />
        <Choice
          label="Version du rapport"
          value={project.report_mode}
          options={REPORT_MODES}
          onChange={(report_mode) => save({ report_mode })}
        />
      </View>

      <View style={ui.card}>
        <Text style={ui.sectionTitle}>Intervenants</Text>
        {actors.map((a) => (
          <View key={a.id} style={{ gap: 8, paddingBottom: 12, borderBottomWidth: 1, borderColor: colors.border }}>
            <View style={[ui.row, { justifyContent: 'space-between' }]}>
              <Text style={{ fontWeight: '600', color: colors.text }}>{a.role}</Text>
              <Pressable onPress={async () => (await deleteActor(db, a.id), reload())} hitSlop={8}>
                <Text style={{ color: colors.danger }}>Retirer</Text>
              </Pressable>
            </View>
            <View style={[ui.row, { flexWrap: 'wrap', gap: 12 }]}>
              <Field label="Nom" value={a.name} onSave={async (name) => (await updateActor(db, a.id, { name }), reload())} />
              <Field
                label="Société"
                value={a.company}
                onSave={async (company) => (await updateActor(db, a.id, { company }), reload())}
              />
              <Field
                label="Contact"
                value={a.contact}
                onSave={async (contact) => (await updateActor(db, a.id, { contact }), reload())}
              />
            </View>
          </View>
        ))}
        <Text style={ui.label}>Ajouter :</Text>
        <View style={[ui.row, { flexWrap: 'wrap' }]}>
          {ACTOR_ROLES.map((role) => (
            <Button key={role} title={`+ ${role}`} onPress={async () => (await addActor(db, id, role), reload())} />
          ))}
        </View>
      </View>

      <View style={ui.card}>
        <Text style={ui.sectionTitle}>Niveaux et plans</Text>
        {levels.length === 0 && <Text style={ui.muted}>Ajoutez un niveau par plan disponible (sous-sol, RDC, étages, toiture).</Text>}
        <View style={[ui.row, { flexWrap: 'wrap', gap: 12 }]}>
          {levels.map((l) => (
            <Pressable
              key={l.id}
              onPress={() => router.push({ pathname: '/level/[id]', params: { id: l.id } })}
              style={({ pressed }) => [
                { width: 150, gap: 6, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 8 },
                pressed && { opacity: 0.7 },
              ]}>
              {l.plan_file ? (
                <Image
                  source={{ uri: projectFile(id, l.plan_file).uri }}
                  style={{ width: '100%', height: 100, backgroundColor: colors.background }}
                  contentFit="contain"
                />
              ) : (
                <View style={{ height: 100, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
                  <Text style={ui.muted}>Pas de plan</Text>
                </View>
              )}
              <Text style={{ fontWeight: '600', color: colors.text }}>{l.name}</Text>
            </Pressable>
          ))}
        </View>
        <Button title="+ Ajouter un niveau" onPress={onAddLevel} />
      </View>

      <View style={ui.card}>
        <Text style={ui.sectionTitle}>Rapport</Text>
        <Text style={ui.muted}>
          Génère le rapport Word sur cet appareil, puis l’envoie par mail ou vers Google Drive, OneDrive ou Fichiers.
        </Text>
        <Button title={exporting ? 'Génération…' : 'Exporter en Word'} variant="primary" onPress={onExport} disabled={exporting} />
      </View>

      <Button title="Supprimer ce DTG" variant="danger" onPress={onDelete} />
    </ScrollView>
  );
}
