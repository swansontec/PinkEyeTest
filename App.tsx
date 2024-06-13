import * as React from 'react';
import {SafeAreaView, Button, TextStyle, Text} from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useDerivedValue,
} from 'react-native-reanimated';

const blue = '#2080c0';

export function RepoCase(): React.JSX.Element {
  // Set up the bug:
  const derivedColor = useDerivedValue(() =>
    interpolateColor(0, [0, 1], [blue, blue]),
  );
  const animatedStyle = useAnimatedStyle(() => ({
    color: derivedColor.value,
    fontSize: 50,
  }));

  // Re-render on press:
  const [count, setCount] = React.useState(0);
  const handleCount = () => setCount(count + 1);

  return (
    <>
      <Animated.Text style={animatedStyle}>{count}</Animated.Text>
      <Button onPress={handleCount} title="Count" />
    </>
  );
}

function App(): React.JSX.Element {
  const [id, setId] = React.useState(0);
  const handleReset = () => setId(id + 1);

  return (
    <SafeAreaView>
      <RepoCase key={`id${id}`} />
      <Button onPress={handleReset} title="Reset" />

      {/* @ts-expect-error numbers aren't valid colors: */}
      <Text style={{color: 0xff2080c0}}>0xff2080c0 (pink)</Text>
    </SafeAreaView>
  );
}

export default App;
