import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Button,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { getExifFromPath, type ImageMetadata } from 'react-native-image-exif';

export default function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [source, setSource] = useState<string>();
  const [metadata, setMetadata] = useState<ImageMetadata>();

  const selectPhoto = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      selectionLimit: 1,
    });

    if (result.didCancel) return;
    if (result.errorCode) {
      Alert.alert(
        'Image picker error',
        result.errorMessage ?? result.errorCode
      );
      return;
    }

    const uri = result.assets?.[0]?.uri;
    if (!uri) {
      Alert.alert(
        'No image URI',
        'The selected photo did not provide a readable URI.'
      );
      return;
    }

    setIsLoading(true);
    setSource(uri);
    setMetadata(undefined);
    try {
      setMetadata(await getExifFromPath(uri));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      Alert.alert('EXIF read failed', message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Image EXIF tester</Text>
        <Text style={styles.description}>
          Select an original photo from the device gallery to inspect its EXIF
          metadata.
        </Text>
        <Button
          title={isLoading ? 'Reading EXIF…' : 'Select a photo'}
          onPress={selectPhoto}
          disabled={isLoading}
        />

        {source ? (
          <Image
            source={{ uri: source }}
            style={styles.image}
            resizeMode="contain"
          />
        ) : null}
        {isLoading ? (
          <ActivityIndicator style={styles.loader} size="large" />
        ) : null}

        {metadata ? (
          <View style={styles.result}>
            <Text style={styles.heading}>Normalized metadata</Text>
            <Text selectable style={styles.json}>
              {JSON.stringify(metadata.normalized, null, 2)}
            </Text>
            <Text style={styles.heading}>Raw tags</Text>
            <Text selectable style={styles.json}>
              {JSON.stringify(metadata.raw, null, 2)}
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, paddingVertical: 40 },
  container: { padding: 20, gap: 16 },
  title: { fontSize: 24, fontWeight: '700' },
  description: { color: '#4b5563', lineHeight: 20 },
  image: { width: '100%', height: 240, backgroundColor: '#f3f4f6' },
  loader: { marginVertical: 24 },
  result: { gap: 8 },
  heading: { fontSize: 18, fontWeight: '600', marginTop: 8 },
  json: {
    backgroundColor: '#111827',
    borderRadius: 8,
    color: '#e5e7eb',
    fontFamily: 'monospace',
    fontSize: 12,
    padding: 12,
  },
});
