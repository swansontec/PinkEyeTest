# Pink-Eye Test

This is a minimal repo case for what we are calling the pink-eye bug. Over in the [Edge app](https://www.edge.app), our show / hide password icon (which looks like an eye) would randomly turn from mint green to pink.

This is a standard `react-native init` project, but with App.tsx modified to show the bug. Yes, this has been [reported upstream](https://github.com/software-mansion/react-native-reanimated/issues/6119).

# The Bug

The bug exists in [react-native-reanimated](https://www.reanimated2.com/). Returning an `interpolateColor` value from a `useDerivedValue` will cause incorrect colors to appear on iOS. Here is the setup:

```js
const blue = '#2080c0';
const derivedColor = useDerivedValue(() =>
  interpolateColor(0, [0, 1], [blue, blue]),
);
```

This *should* always render as blue if we put it in an animated style:

```js
const animatedStyle = useAnimatedStyle(() => ({
  color: derivedColor.value,
}));
```

However, on iOS specifically, the text will glitch to pink after the first button press:

```js
  // Cause a re-render on press:
  const [count, setCount] = React.useState(0);
  const handleCount = () => setCount(count + 1);

  return (
    <>
      <Animated.Text style={animatedStyle}>
        {count}
      </Animated.Text>
      <Button onPress={handleCount} title="Count" />
    </>
  );
```

# The Steps

Here is what seems to be happening:

1. First render
    1. JS thread: `useDerivedValue` returns the string `"rgba(32, 128, 192, 1)"`
    2. JS thread: `useAnimatedStyle` returns the style `{ color: "rgba(32, 128, 192, 1)" }`
    3. The text renders as blue
    4. UI thread: `useDerivedValue` runs again, and returns the *integer* 0xff2080c0. This seems to be some sort of optimization, since this differs from what the JS thread returns.
2. User presses the button
3. Second render
    1. JS thread: `useDerivedValue` does *not* run, but returns the saved 0xff2080c0 from the UI thread.
    2. JS thread: `useAnimatedStyle` returns the style `{ color: 0xff2080c0 }`
    3. The text renders as pink

Directly rendering `<Text style={{ color: 0xff2080c0 }}>Hello</Text>` produces the same pink color (although TypeScript complains). Messing around with the values, it seems that the JS thread interprets integers as 0xrrggbbaa, whereas the Reanimated UI thread interprets integers as 0xaarrggbb.

# The Fix

As a hacky work-around until the Reanimated team fixes the bug, we are using [patch-package](https://www.npmjs.com/package/patch-package) to edit node_modules/react-native-reanimated/src/reanimated2/Colors.ts, around line 520:

```diff
-  if (IS_WEB || !_WORKLET) {
+  if (!IS_ANDROID || !_WORKLET) {
     return `rgba(${r}, ${g}, ${b}, ${alpha})`;
   }
```

This removes a performance optimization, but it does solve the bug.
