import * as Updates from 'expo-updates';
import { useEffect, useRef } from 'react';
import { Alert } from 'react-native';

/**
 * expo-updates vérifie et télécharge les mises à jour au lancement (ON_LOAD).
 * Dès qu'une nouvelle version est prête, on propose de redémarrer l'app pour
 * l'appliquer tout de suite (sinon elle s'applique au prochain lancement).
 */
export function useOtaUpdates() {
  const { isUpdatePending } = Updates.useUpdates();
  const asked = useRef(false);

  useEffect(() => {
    if (!Updates.isEnabled || !isUpdatePending || asked.current) return;
    asked.current = true;
    Alert.alert(
      'Mise à jour disponible',
      'Une nouvelle version de DTG simple a été téléchargée. Redémarrer maintenant pour l’appliquer ?',
      [
        { text: 'Plus tard', style: 'cancel' },
        { text: 'Redémarrer', onPress: () => void Updates.reloadAsync() },
      ],
    );
  }, [isUpdatePending]);
}
