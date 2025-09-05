import { SafeAreaView } from 'react-native';
import FeedScreen from './src/screens/FeedScreen';

export default function App() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <FeedScreen />
    </SafeAreaView>
  );
}