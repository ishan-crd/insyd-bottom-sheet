# insyd-bottom-sheet

[![npm version](https://img.shields.io/npm/v/insyd-bottom-sheet.svg?style=flat-square)](https://www.npmjs.com/package/insyd-bottom-sheet)
[![license](https://img.shields.io/npm/l/insyd-bottom-sheet.svg?style=flat-square)](./LICENSE)
[![platform](https://img.shields.io/badge/platform-iOS%20%7C%20Android-lightgrey?style=flat-square)](https://reactnative.dev)
[![expo compatible](https://img.shields.io/badge/Expo%20Go-compatible-4630EB?style=flat-square&logo=expo)](https://expo.dev)

A smooth, physics-based bottom sheet for React Native — built by [Ishan Gupta](https://github.com/ishan-crd).

Powered by `react-native-reanimated` and `react-native-gesture-handler`. **Works in Expo Go, Expo bare workflow, and React Native CLI** — no native rebuild required.

---

## Features

- **Spring physics** — feels natural, not mechanical
- **Drag-to-dismiss** — with configurable distance and velocity thresholds
- **Backdrop tap to dismiss**
- **Keyboard-avoiding** — content shifts up when the keyboard appears (iOS padding / Android height)
- **Fully typed** — complete TypeScript support with exported interfaces
- **No native code** — runs in Expo Go out of the box
- **Zero extra dependencies** — only React Native, Reanimated 3, and Gesture Handler

---

## Installation

```sh
# npm
npm install insyd-bottom-sheet

# yarn
yarn add insyd-bottom-sheet

# Expo (recommended — picks compatible peer dep versions automatically)
npx expo install insyd-bottom-sheet
```

### Peer dependencies

This package requires `react-native-reanimated` and `react-native-gesture-handler`. If you haven't already installed them:

```sh
npx expo install react-native-reanimated react-native-gesture-handler
```

For **bare React Native**, follow the official setup guides:
- [Reanimated installation](https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/getting-started/)
- [Gesture Handler installation](https://docs.swmansion.com/react-native-gesture-handler/docs/fundamentals/installation/)

> **Expo Go users:** both packages ship with Expo Go — no custom dev client needed.

---

## Setup

### 1. Wrap your app in `GestureHandlerRootView`

This is required by `react-native-gesture-handler`. Wrap your root component once:

```tsx
// App.tsx (or _layout.tsx for Expo Router)
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* rest of your app */}
    </GestureHandlerRootView>
  );
}
```

### 2. Add the Reanimated Babel plugin

In your `babel.config.js`:

```js
module.exports = {
  presets: ["babel-preset-expo"], // or 'metro-react-native-babel-preset' for RN CLI
  plugins: ["react-native-reanimated/plugin"],
};
```

After editing `babel.config.js`, restart Metro with a cleared cache:

```sh
npx expo start --clear
# or for RN CLI
npx react-native start --reset-cache
```

---

## Usage

### Basic

```tsx
import React, { useState } from "react";
import { Button, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SmoothSheet } from "insyd-bottom-sheet";

export default function App() {
  const [open, setOpen] = useState(false);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Button title="Open Sheet" onPress={() => setOpen(true)} />
      </View>

      <SmoothSheet isVisible={open} onDismiss={() => setOpen(false)}>
        <View style={{ padding: 24 }}>
          <Text style={{ fontSize: 20, fontWeight: "600" }}>Hello 👋</Text>
          <Text style={{ marginTop: 8, color: "#64748b" }}>
            Drag down or tap the backdrop to dismiss.
          </Text>
        </View>
      </SmoothSheet>
    </GestureHandlerRootView>
  );
}
```

### Custom height

```tsx
<SmoothSheet
  isVisible={open}
  onDismiss={() => setOpen(false)}
  minHeightFraction={0.5}   // sheet takes up at least 50% of screen
  maxHeightFraction={0.85}  // caps at 85% of screen
>
  {/* your content */}
</SmoothSheet>
```

### Custom appearance

```tsx
<SmoothSheet
  isVisible={open}
  onDismiss={() => setOpen(false)}
  backgroundColor="#1e293b"
  borderRadius={20}
  handleColor="#475569"
  backdropColor="rgba(0,0,0,0.7)"
>
  {/* dark-themed content */}
</SmoothSheet>
```

### Custom spring physics

```tsx
<SmoothSheet
  isVisible={open}
  onDismiss={() => setOpen(false)}
  springConfig={{ damping: 20, stiffness: 220, mass: 0.8 }}
>
  {/* snappier feel */}
</SmoothSheet>
```

### With a ScrollView inside

Wrap long content in a `ScrollView`. The sheet handles keyboard avoidance automatically:

```tsx
import { ScrollView, Text } from "react-native";
import { SmoothSheet } from "insyd-bottom-sheet";

<SmoothSheet
  isVisible={open}
  onDismiss={() => setOpen(false)}
  minHeightFraction={0.7}
>
  <ScrollView
    contentContainerStyle={{ padding: 24, paddingBottom: 48 }}
    showsVerticalScrollIndicator={false}
    keyboardShouldPersistTaps="handled"
  >
    {/* long content */}
  </ScrollView>
</SmoothSheet>
```

### With TextInput (keyboard-aware)

The built-in `KeyboardAvoidingView` handles this automatically:

```tsx
import { TextInput, View } from "react-native";
import { SmoothSheet } from "insyd-bottom-sheet";

<SmoothSheet isVisible={open} onDismiss={() => setOpen(false)}>
  <View style={{ padding: 24, gap: 12 }}>
    <TextInput
      placeholder="Your name"
      style={{
        borderWidth: 1,
        borderColor: "#e2e8f0",
        borderRadius: 8,
        padding: 12,
      }}
    />
  </View>
</SmoothSheet>
```

---

## Props

| Prop | Type | Default | Required | Description |
|------|------|---------|----------|-------------|
| `isVisible` | `boolean` | — | ✅ | Controls sheet visibility |
| `onDismiss` | `() => void` | — | ✅ | Called when sheet should close |
| `children` | `React.ReactNode` | — | ✅ | Content rendered inside the sheet |
| `minHeightFraction` | `number` | `0.4` | | Min height as a fraction of screen (0–1) |
| `maxHeightFraction` | `number` | `0.97` | | Max height as a fraction of screen (0–1) |
| `backgroundColor` | `string` | `"#ffffff"` | | Sheet background color |
| `borderRadius` | `number` | `28` | | Top corner radius |
| `handleColor` | `string` | `"#CBD5E1"` | | Drag handle pill color |
| `backdropColor` | `string` | `"rgba(0,0,0,0.5)"` | | Backdrop overlay color |
| `dismissThreshold` | `number` | `80` | | Drag distance in px to trigger dismiss |
| `dismissVelocityThreshold` | `number` | `800` | | Drag velocity in px/s to trigger dismiss |
| `springConfig` | `SpringConfig` | see below | | Override spring animation |

### SpringConfig

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `damping` | `number` | `28` | Higher = less bouncy |
| `stiffness` | `number` | `160` | Higher = faster |
| `mass` | `number` | `0.9` | Higher = heavier feel |

---

## TypeScript

Both the component and its props are fully typed. You can import the types:

```ts
import type { SmoothSheetProps, SpringConfig } from "insyd-bottom-sheet";
```

---

## Requirements

| | Minimum version |
|---|---|
| React Native | 0.71 |
| React | 18.0 |
| `react-native-reanimated` | 3.0.0 |
| `react-native-gesture-handler` | 2.0.0 |
| Expo SDK *(if using Expo)* | 49+ |

---

## How it works

`insyd-bottom-sheet` uses `useSharedValue` and `withSpring` from Reanimated to animate the sheet on the UI thread — meaning animations are never blocked by JavaScript work. The drag-to-dismiss gesture runs via `Gesture.Pan()` from Gesture Handler, also on the UI thread. No bridge round-trips, no jank.

---

## License

MIT © 2024 [Ishan Gupta](https://github.com/ishan-crd)

---

## Contributing

Issues and PRs welcome at [github.com/ishan-crd/insyd-bottom-sheet](https://github.com/ishan-crd/insyd-bottom-sheet).
