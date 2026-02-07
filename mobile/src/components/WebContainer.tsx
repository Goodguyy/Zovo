import React from 'react';
import { View, Platform, useWindowDimensions, StyleSheet } from 'react-native';

interface WebContainerProps {
  children: React.ReactNode;
  maxWidth?: number;
  backgroundColor?: string;
}

const MAX_CONTENT_WIDTH = 480;

export function WebContainer({
  children,
  maxWidth = MAX_CONTENT_WIDTH,
  backgroundColor = '#f9fafb'
}: WebContainerProps) {
  const { width: windowWidth } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';

  if (!isWeb) {
    return <>{children}</>;
  }

  return (
    <View style={[styles.outerContainer, { backgroundColor }]}>
      <View
        style={[
          styles.innerContainer,
          {
            maxWidth,
            width: '100%',
          }
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    alignItems: 'center',
  },
  innerContainer: {
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
});
