import type React from "react";
import { useEffect, useRef, useState } from "react";
import {
  BackHandler,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
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

import { SheetPortal } from "./SheetHost";

const DEFAULT_SPRING = {
  damping: 28,
  stiffness: 160,
  mass: 0.9,
};

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
   * Minimum height of the sheet as a fraction of window height (0–1).
   * @default 0.4
   */
  minHeightFraction?: number;
  /**
   * Maximum height of the sheet as a fraction of window height (0–1).
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
  /**
   * Extra padding applied below the sheet content, e.g. the bottom safe-area
   * inset on gesture-nav Android devices / notched iPhones. Pass
   * `useSafeAreaInsets().bottom` from the host app.
   * @default 0
   */
  bottomInset?: number;
  /**
   * Accessibility label announced for the backdrop's dismiss action.
   * @default "Close"
   */
  dismissAccessibilityLabel?: string;
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
  bottomInset = 0,
  dismissAccessibilityLabel = "Close",
}: SmoothSheetProps) {
  const spring = { ...DEFAULT_SPRING, ...springConfig };

  // Live window height — correct across rotation, split-screen, and foldables.
  const { height: windowHeight } = useWindowDimensions();

  // The sheet is *translated* above the keyboard, driven by global Keyboard
  // events. Because the sheet now renders in the app's own window (via
  // SheetPortal, not a native <Modal>), the focused TextInput lives in the same
  // window these events observe — so this fires and reports the right height in
  // Expo Go, dev clients, AND release builds, including Android 15+ forced
  // edge-to-edge where a Modal's separate window used to break it.
  const keyboardHeight = useSharedValue(0);

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios"
        ? "keyboardWillShow"
        : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios"
        ? "keyboardWillHide"
        : "keyboardDidHide";
    const showSub = Keyboard.addListener(showEvent, (e) => {
      keyboardHeight.value = withTiming(
        e.endCoordinates.height,
        {
          duration:
            Platform.OS === "ios"
              ? (e.duration ?? 250)
              : 160,
        },
      );
    });
    const hideSub = Keyboard.addListener(hideEvent, (e) => {
      keyboardHeight.value = withTiming(0, {
        duration:
          Platform.OS === "ios" ? (e.duration ?? 250) : 160,
      });
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const translateY = useSharedValue(windowHeight);
  const backdropOpacity = useSharedValue(0);
  // Keep the sheet mounted through the closing animation so it can slide out.
  const [mounted, setMounted] = useState(isVisible);
  // Guards against double-dismiss (back button mashing, backdrop tap during close)
  const isClosing = useRef(false);

  useEffect(() => {
    if (isVisible) {
      isClosing.current = false;
      setMounted(true);
      translateY.value = withSpring(0, spring);
      backdropOpacity.value = withTiming(1, {
        duration: 250,
      });
    } else {
      translateY.value = withSpring(windowHeight, spring);
      backdropOpacity.value = withTiming(
        0,
        { duration: 200 },
        (finished) => {
          if (finished) runOnJS(setMounted)(false);
        },
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible]);

  function dismiss() {
    if (isClosing.current) return;
    isClosing.current = true;
    translateY.value = withSpring(windowHeight, spring);
    backdropOpacity.value = withTiming(
      0,
      { duration: 200 },
      (finished) => {
        if (finished) {
          runOnJS(setMounted)(false);
          runOnJS(onDismiss)();
        }
      },
    );
  }

  // Android hardware back closes the sheet (replaces Modal's onRequestClose).
  useEffect(() => {
    if (!mounted || Platform.OS !== "android") return;
    const sub = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        dismiss();
        return true;
      },
    );
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

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
    transform: [
      {
        translateY: translateY.value - keyboardHeight.value,
      },
    ],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  if (!mounted) return null;

  return (
    <SheetPortal>
      <View
        style={StyleSheet.absoluteFill}
        pointerEvents="box-none"
      >
        {/* Backdrop */}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: backdropColor },
            backdropStyle,
          ]}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={dismiss}
            accessibilityRole="button"
            accessibilityLabel={dismissAccessibilityLabel}
          />
        </Animated.View>

        {/* Sheet */}
        <Animated.View
          style={[
            styles.sheet,
            {
              borderTopLeftRadius: borderRadius,
              borderTopRightRadius: borderRadius,
              backgroundColor,
              minHeight: windowHeight * minHeightFraction,
              maxHeight: windowHeight * maxHeightFraction,
              paddingBottom: bottomInset,
            },
            sheetStyle,
          ]}
          pointerEvents="box-none"
          accessibilityViewIsModal
        >
          {/* Drag handle */}
          <GestureDetector gesture={panGesture}>
            <View style={styles.handleArea}>
              <View
                style={[
                  styles.handle,
                  { backgroundColor: handleColor },
                ]}
              />
            </View>
          </GestureDetector>

          {/* Content — keyboard avoidance is handled by translating the whole
              sheet (see sheetStyle); no KeyboardAvoidingView needed. */}
          <View style={styles.content}>{children}</View>
        </Animated.View>
      </View>
    </SheetPortal>
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
