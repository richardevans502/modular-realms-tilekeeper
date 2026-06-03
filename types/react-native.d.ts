declare module 'react-native' {
  import type { ReactElement } from 'react';
  export const StyleSheet: {
    create<T extends Record<string, unknown>>(styles: T): T;
  };
  export const Text: (props: any) => ReactElement;
  export const View: (props: any) => ReactElement;
}
