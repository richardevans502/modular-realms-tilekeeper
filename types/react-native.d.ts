declare module 'react-native' {
  import type { ReactElement, ReactNode } from 'react';

  export const StyleSheet: {
    create<T extends Record<string, unknown>>(styles: T): T;
  };

  export interface BasicNativeProps {
    accessibilityLabel?: string;
    accessibilityRole?: string;
    accessibilityState?: Record<string, unknown>;
    children?: ReactNode;
    contentContainerStyle?: unknown;
    disabled?: boolean;
    horizontal?: boolean;
    key?: string;
    onPress?: () => void;
    placeholder?: string;
    placeholderTextColor?: string;
    showsHorizontalScrollIndicator?: boolean;
    style?: unknown;
    value?: string;
  }

  export interface TextInputProps extends BasicNativeProps {
    multiline?: boolean;
    onChangeText?: (text: string) => void;
  }

  export const Text: (props: BasicNativeProps) => ReactElement;
  export const View: (props: BasicNativeProps) => ReactElement;
  export const ScrollView: (props: BasicNativeProps) => ReactElement;
  export const TextInput: (props: TextInputProps) => ReactElement;
  export const Pressable: (props: BasicNativeProps & { style?: unknown | ((state: { pressed: boolean }) => unknown) }) => ReactElement;
  export const TouchableOpacity: (props: BasicNativeProps) => ReactElement;
}
