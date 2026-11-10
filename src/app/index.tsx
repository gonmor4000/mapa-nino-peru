import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import * as Updates from 'expo-updates';
import { FlatList, Pressable, Text, View } from 'react-native';

import { createProject, listProjects } from '@/db/repo';
import type { Project } from '@/model/types';
import { Button } from '@/ui/controls';
import { colors, ui } from '@/ui/theme';

const appVersionLabel = (() => {
  const date = Updates.isEmbeddedLaunch ? null : Updates.createdAt;
  return date
    ? `Version ${Updates.runtimeVersion} · mise à jour du ${date.toLocaleDateString('fr-FR')}`
    : `Version ${Updates.runtimeVersion ?? 'dev'} · d’origine`;
})();

export default function ProjectsScreen() {
  const db = useSQLiteContext();
  const [projects, setProjects] = useState<Project[]>([]);

  useFocusEffect(
    useCallback(() => {
      listProjects(db).then(setProjects);
    }, [db]),
  );

  const onCreate = async () => {
    const id = await createProject(db);
    router.push({ pathname: '/project/[id]', params: { id } });
  };

  return (
    <View style={ui.screen}>
      <FlatList
        contentContainerStyle={ui.content}
        data={projects}
        keyExtractor={(p) => p.id}
        ListHeaderComponent={<Button title="+ Nouveau DTG" variant="primary" onPress={onCreate} />}
        ListEmptyComponent={
          <Text style={[ui.muted, { textAlign: 'center', marginTop: 32 }]}>
            Aucun DTG pour l’instant. Créez-en un pour commencer.
          </Text>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push({ pathname: '/project/[id]', params: { id: item.id } })}
            style={({ pressed }) => [ui.card, pressed && { opacity: 0.7 }]}>
            <Text style={{ fontSize: 17, fontWeight: '600', color: colors.text }}>{item.name}</Text>
            <Text style={ui.muted}>
              {[item.address, item.file_number && `Dossier ${item.file_number}`].filter(Boolean).join(' · ') ||
                'Adresse à renseigner'}
            </Text>
          </Pressable>
        )}
        ListFooterComponent={
          <Text style={[ui.muted, { textAlign: 'center', marginTop: 24, fontSize: 12 }]}>{appVersionLabel}</Text>
        }
      />
    </View>
  );
}
