import * as DocumentPicker from 'expo-document-picker';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Image as RNImage, ScrollView, Text, View } from 'react-native';

import { deleteLevel, getLevel, renameLevel, setLevelPlan } from '@/db/repo';
import type { Level } from '@/model/types';
import { importImage, projectFile, removeProjectFile } from '@/storage/files';
import { Button, Field } from '@/ui/controls';
import { ui } from '@/ui/theme';

const getImageSize = (uri: string) =>
  new Promise<{ width: number; height: number }>((resolve, reject) =>
    RNImage.getSize(uri, (width, height) => resolve({ width, height }), reject),
  );

export default function LevelScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const [level, setLevel] = useState<Level | null>(null);

  const reload = useCallback(async () => setLevel(await getLevel(db, id)), [db, id]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  if (!level) return <ActivityIndicator style={{ marginTop: 32 }} />;

  const attachPlan = async (uri: string, size?: { width: number; height: number }) => {
    const dims = size ?? (await getImageSize(uri));
    const file = importImage(level.project_id, uri);
    if (level.plan_file) removeProjectFile(level.project_id, level.plan_file);
    await setLevelPlan(db, level.id, { file, ...dims });
    await reload();
  };

  const fromCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return Alert.alert('Accès à l’appareil photo refusé');
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (!result.canceled) await attachPlan(result.assets[0].uri, result.assets[0]);
  };

  const fromLibrary = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.9 });
    if (!result.canceled) await attachPlan(result.assets[0].uri, result.assets[0]);
  };

  const fromFiles = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: ['image/png', 'image/jpeg'], copyToCacheDirectory: true });
    if (!result.canceled) await attachPlan(result.assets[0].uri);
  };

  const onDelete = () =>
    Alert.alert(`Supprimer le niveau ${level.name} ?`, undefined, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          await deleteLevel(db, level.id);
          router.back();
        },
      },
    ]);

  const ratio = level.plan_width && level.plan_height ? level.plan_width / level.plan_height : 1;

  return (
    <ScrollView style={ui.screen} contentContainerStyle={ui.content}>
      <Stack.Screen options={{ title: level.name }} />
      <View style={ui.card}>
        <Field label="Nom du niveau" value={level.name} onSave={async (name) => (await renameLevel(db, level.id, name), reload())} />
      </View>

      <View style={ui.card}>
        <Text style={ui.sectionTitle}>Plan</Text>
        {level.plan_file ? (
          <Image
            source={{ uri: projectFile(level.project_id, level.plan_file).uri }}
            style={{ width: '100%', aspectRatio: ratio }}
            contentFit="contain"
          />
        ) : (
          <Text style={ui.muted}>
            Aucun plan. Importez une image (JPG ou PNG). Pour un plan en PDF, faites-en une capture d’écran en attendant
            l’import PDF direct.
          </Text>
        )}
        <View style={[ui.row, { flexWrap: 'wrap' }]}>
          <Button title="Photographier le plan" onPress={fromCamera} />
          <Button title="Choisir dans les photos" onPress={fromLibrary} />
          <Button title="Importer un fichier" onPress={fromFiles} />
        </View>
      </View>

      <Button title="Supprimer ce niveau" variant="danger" onPress={onDelete} />
    </ScrollView>
  );
}
