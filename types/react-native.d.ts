declare module 'react-native' {
  import type { ReactElement, ReactNode } from 'react';

  export const StyleSheet: {
    create<T extends Record<string, unknown>>(styles: T): T;
    absoluteFill: object;
  };

  export interface BasicNativeProps {
    accessibilityLabel?: string;
    accessibilityRole?: string;
    accessibilityState?: Record<string, unknown>;
    activeOpacity?: number;
    allowFontScaling?: boolean;
    maxFontSizeMultiplier?: number;
    animationType?: string;
    behavior?: string;
    children?: ReactNode;
    contentContainerStyle?: unknown;
    data?: unknown[];
    disabled?: boolean;
    horizontal?: boolean;
    keyboardType?: string;
    key?: string;
    keyExtractor?: (item: any) => string;
    keyboardVerticalOffset?: number;
    ListEmptyComponent?: ReactNode;
    multiline?: boolean;
    numberOfLines?: number;
    onChangeText?: (text: string) => void;
    onLongPress?: () => void;
    onPress?: () => void;
    onRequestClose?: () => void;
    onResponderGrant?: unknown;
    onResponderMove?: unknown;
    onResponderRelease?: unknown;
    onResponderTerminate?: unknown;
    onStartShouldSetResponder?: unknown;
    onMoveShouldSetResponder?: unknown;
    onValueChange?: (value: boolean) => void;
    placeholder?: string;
    placeholderTextColor?: string;
    renderItem?: (info: { item: any }) => ReactNode;
    scrollEnabled?: boolean;
    showsHorizontalScrollIndicator?: boolean;
    size?: string;
    style?: unknown;
    thumbColor?: string;
    trackColor?: { false?: string; true?: string };
    transparent?: boolean;
    value?: string | boolean;
    visible?: boolean;
  }

  export interface TextInputProps extends BasicNativeProps {
    textAlignVertical?: string;
  }

  export const Animated: {
    View: (props: BasicNativeProps) => ReactElement;
    Value: new (value: number) => { setValue: (v: number) => void };
    loop: (animation: { start: () => void; stop: () => void }) => { start: () => void; stop: () => void };
    timing: (value: Animated.Value, config: { toValue: number; duration?: number; useNativeDriver?: boolean }) => { start: () => void; stop: () => void };
  };
  export const useWindowDimensions: () => { width: number; height: number; fontScale: number; scale: number };
  export const KeyboardAvoidingView: (props: BasicNativeProps) => ReactElement;
  export const Platform: { OS: string };
  export const ActivityIndicator: (props: BasicNativeProps) => ReactElement;
  export const Switch: (props: BasicNativeProps) => ReactElement;
  export const Modal: (props: BasicNativeProps) => ReactElement;

  export interface AlertButton {
    text: string;
    style?: 'default' | 'cancel' | 'destructive';
    onPress?: () => void;
  }

  export const Text: (props: BasicNativeProps) => ReactElement;
  export const View: (props: BasicNativeProps) => ReactElement;
  export const ScrollView: (props: BasicNativeProps) => ReactElement;
  export const FlatList: (props: BasicNativeProps) => ReactElement;
  export const TextInput: (props: TextInputProps) => ReactElement;
  export const Pressable: (props: BasicNativeProps & { style?: unknown | ((state: { pressed: boolean }) => unknown) }) => ReactElement;
  export const TouchableOpacity: (props: BasicNativeProps) => ReactElement;
  export const Alert: {
    alert(title: string, message?: string, buttons?: AlertButton[]): void;
  };

  export interface GestureTouch {
    pageX: number;
    pageY: number;
  }

  export interface GestureResponderEvent {
    nativeEvent: {
      touches: GestureTouch[];
    };
  }

  export interface PanResponderGestureState {
    dx: number;
    dy: number;
  }

  export const PanResponder: {
    create(config: {
      onStartShouldSetPanResponder?: () => boolean;
      onMoveShouldSetPanResponder?: () => boolean;
      onPanResponderGrant?: (event: GestureResponderEvent, gestureState: PanResponderGestureState) => void;
      onPanResponderMove?: (event: GestureResponderEvent, gestureState: PanResponderGestureState) => void;
      onPanResponderRelease?: () => void;
      onPanResponderTerminate?: () => void;
    }): { panHandlers: Record<string, unknown> };
  };
}
