import { Text, View, StyleSheet } from 'react-native';
import { getExifFromPath } from 'react-native-image-exif';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.line}>react-native-image-exif</Text>
      <Text style={styles.line}>getExifFromPath: {typeof getExifFromPath}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  line: {
    marginBottom: 8,
  },
});
