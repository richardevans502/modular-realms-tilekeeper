import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { tileKeeperTheme } from './theme';

interface Props {
  children: ReactNode;
  onReset?: () => void;
  onGoBack?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.icon}>⚠</Text>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>
            {this.state.error?.message ?? 'An unexpected error occurred.'}
          </Text>
          <View style={styles.buttonRow}>
            {this.props.onGoBack ? (
              <TouchableOpacity
                accessibilityLabel="Go back"
                accessibilityRole="button"
                accessibilityState={{ disabled: false }}
                onPress={this.props.onGoBack}
                style={[styles.button, styles.buttonSecondary]}
              >
                <Text style={styles.buttonTextSecondary}>Go back</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              accessibilityLabel="Try again"
              accessibilityRole="button"
              accessibilityState={{ disabled: false }}
              onPress={this.handleReset}
              style={styles.button}
            >
              <Text style={styles.buttonText}>Try again</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tileKeeperTheme.colours.background,
    padding: 24,
    gap: 12,
  },
  icon: { fontSize: 40, allowFontScaling: true },
  title: {
    color: tileKeeperTheme.colours.text,
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    allowFontScaling: true,
  },
  message: {
    color: tileKeeperTheme.colours.mutedText,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    allowFontScaling: true,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  button: {
    backgroundColor: tileKeeperTheme.colours.primary,
    borderRadius: tileKeeperTheme.radius.button,
    paddingHorizontal: 24,
    paddingVertical: 12,
    minHeight: tileKeeperTheme.touch.minimum,
    justifyContent: 'center',
  },
  buttonSecondary: {
    backgroundColor: tileKeeperTheme.colours.raisedSurface,
    borderColor: tileKeeperTheme.colours.border,
    borderWidth: 1,
  },
  buttonText: {
    color: tileKeeperTheme.colours.onFrame,
    fontSize: 16,
    fontWeight: '800',
    allowFontScaling: true,
  },
  buttonTextSecondary: {
    color: tileKeeperTheme.colours.text,
    fontSize: 16,
    fontWeight: '800',
    allowFontScaling: true,
  },
});
