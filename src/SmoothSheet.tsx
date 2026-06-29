/**
 * insyd-bottom-sheet
 *
 * A smooth, physics-based bottom sheet for React Native.
 * Built on react-native-reanimated and react-native-gesture-handler.
 * Compatible with Expo Go, Expo bare workflow, and React Native CLI.
 *
 * Copyright (c) 2024 Ishan Gupta <https://github.com/ishan-crd>
 * MIT License — see LICENSE file for details.
 */

import React, { useEffect } from "react";
import {
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import {
  Gesture,
  GestureDetector,
} from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

const SCREEN_HEIGHT = Dimensions.get("window").height;

const DEFAULT_SPRING = { damping: 28, stiffness: 160, mass: 0.9 };

export interface SpringConfig {
  damping?: number;
  stiffness?: number;
  mass?: number;
}

export interface SmoothSheetProps {
  /** Controls whether the sheet is visible. */
  isVisible: boolean;
  /** Called when the sheet should be dismissed (backdrop tap, drag-to-dismiss, or close button). */
  onDismiss: () => void;
  /** Content rendered inside the sheet. */
  children: React.ReactNode;
  /**
   * Minimum height of the sheet as a fraction of screen height (0–1).
   * @default 0.4
   */
  minHeightFraction?: number;
  /**
   * Maximum height of the sheet as a fraction of screen height (0–1).
   * @default 0.97
   */
  maxHeightFraction?: number;
  /**
   * Background color of the sheet.
   * @default "#ffffff"
   */
  backgroundColor?: string;
  /**
   * Border radius applied to the top-left and top-right corners.
   * @default 28
   */
  borderRadius?: number;
  /**
   * Color of the drag handle pill.
   * @default "#CBD5E1"
   */
  handleColor?: string;
  /**
   * Background color of the backdrop overlay.
   * @default "rgba(0,0,0,0.5)"
   */
  backdropColor?: string;
  /**
   * Vertical drag distance in px required to trigger dismiss.
   * @default 80
   */
  dismissThreshold?: number;
  /**
   * Vertical velocity in px/s that triggers dismiss even before reaching dismissThreshold.
   * @default 800
   */
  dismissVelocityThreshold?: number;
  /**
   * Override the spring animation config.
   * Merged over the default: { damping: 28, stiffness: 160, mass: 0.9 }
   */
  springConfig?: SpringConfig;
}

export function SmoothSheet({
  isVisible,
  onDismiss,
  children,
  minHeightFraction = 0.4,
  maxHeightFraction = 0.97,
  backgroundColor = "#ffffff",
  borderRadius = 28,
  handleColor = "#CBD5E1",
  backdropColor = "rgba(0,0,0,0.5)",
  dismissThreshold = 80,
  dismissVelocityThreshold = 800,
  springConfig,
}: SmoothSheetProps) {
  const spring = { ...DEFAULT_SPRING, ...springConfig };

  const translateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (isVisible) {
      translateY.value = withSpring(0, spring);
      backdropOpacity.value = withTiming(1, { duration: 250 });
    } else {
      translateY.value = withSpring(SCREEN_HEIGHT, spring);
      backdropOpacity.value = withTiming(0, { duration: 200 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible]);

  function dismiss() {
    translateY.value = withSpring(SCREEN_HEIGHT, spring);
    backdropOpacity.value = withTiming(
      0,
      { duration: 200 },
      () => {
        runOnJS(onDismiss)();
      },
    );
  }

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationY > 0) {
        translateY.value = e.translationY;
      }
    })
    .onEnd((e) => {
      if (
        e.translationY > dismissThreshold ||
        e.velocityY > dismissVelocityThreshold
      ) {
        runOnJS(dismiss)();
      } else {
        translateY.value = withSpring(0, spring);
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  if (!isVisible && translateY.value === SCREEN_HEIGHT) {
    return null;
  }

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Backdrop */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: backdropColor },
          backdropStyle,
        ]}
        pointerEvents={isVisible ? "auto" : "none"}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={dismiss} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View
        style={[
          styles.sheet,
          {
            borderTopLeftRadius: borderRadius,
            borderTopRightRadius: borderRadius,
            backgroundColor,
            minHeight: SCREEN_HEIGHT * minHeightFraction,
            maxHeight: SCREEN_HEIGHT * maxHeightFraction,
          },
          sheetStyle,
        ]}
        pointerEvents="box-none"
      >
        {/* Drag handle */}
        <GestureDetector gesture={panGesture}>
          <View style={styles.handleArea}>
            <View
              style={[styles.handle, { backgroundColor: handleColor }]}
            />
          </View>
        </GestureDetector>

        {/* Content */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.content}
        >
          {children}
        </KeyboardAvoidingView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 24,
  },
  handleArea: {
    alignItems: "center",
    paddingVertical: 12,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  content: {
    flex: 1,
  },
});
