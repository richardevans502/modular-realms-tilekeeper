declare module 'expo-router' {
  import type { ComponentType, ReactNode } from 'react';

  type RouteHref = string | { pathname: string; params?: Record<string, string | number | boolean | undefined> };
  type AnyProps = Record<string, unknown> & { children?: ReactNode };
  type TabBarIconProps = { focused: boolean; color?: string; size?: number };
  type ScreenOptionsContext = { route: { name: string } };
  type ScreenOptions = Record<string, unknown> & { tabBarIcon?: (props: TabBarIconProps) => ReactNode };
  type RouterComponent = ComponentType<AnyProps> & { Screen: ComponentType<AnyProps> };
  type TabsComponent = ComponentType<AnyProps & { screenOptions?: (context: ScreenOptionsContext) => ScreenOptions }> & {
    Screen: ComponentType<AnyProps>;
  };

  export const Link: ComponentType<AnyProps>;
  export const Stack: RouterComponent;
  export const Tabs: TabsComponent;
  export const router: {
    back: () => void;
    push: (href: RouteHref) => void;
    replace: (href: RouteHref) => void;
  };
  export function useRouter(): typeof router;
  export function usePathname(): string;
  export function useLocalSearchParams<T extends Record<string, unknown> = Record<string, string | string[] | undefined>>(): T;
  export function useFocusEffect(effect: () => void | (() => void)): void;

  export type { TabBarIconProps };
}
