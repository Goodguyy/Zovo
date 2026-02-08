import React from 'react';
import { View, Platform, useWindowDimensions, StyleSheet, ScrollView } from 'react-native';

interface WebContainerProps {
  children: React.ReactNode;
  maxWidth?: number;
  backgroundColor?: string;
}

const MAX_CONTENT_WIDTH = 420;

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
            width: windowWidth > maxWidth ? maxWidth : '100%',
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
    width: '100%',
    minHeight: '100%',
  },
  innerContainer: {
    flex: 1,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 30,
    overflow: 'hidden',
  },
});
