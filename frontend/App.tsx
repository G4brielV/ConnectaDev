import { StatusBar } from 'expo-status-bar';
import { QuizScreen } from './src/pages/QuizScreen';

export default function App() {
  return (
    <>
      <QuizScreen />
      <StatusBar style="dark" />
    </>
  );
}
