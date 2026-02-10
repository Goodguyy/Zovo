import React, { useState, useRef } from 'react';
import { View, Text, Pressable, Dimensions, FlatList, Image } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Camera, Users, Star, ArrowRight, Check } from 'lucide-react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

const ONBOARDING_SLIDES = [
  {
    id: '1',
    icon: Camera,
    title: 'Showcase Your Work',
    description: 'Post photos of your completed jobs to build a portfolio that speaks for itself. No fancy descriptions needed - let your work do the talking.',
    color: '#059669',
  },
  {
    id: '2',
    icon: Users,
    title: 'Get Discovered',
    description: 'Customers in your area can find you by skill and location. The more you post, the more visible you become.',
    color: '#0284c7',
  },
  {
    id: '3',
    icon: Star,
    title: 'Build Your Reputation',
    description: 'Earn endorsements from satisfied customers. Top performers appear on the leaderboard and get more visibility.',
    color: '#d97706',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = () => {
    if (currentIndex < ONBOARDING_SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
      setCurrentIndex(currentIndex + 1);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      handleGetStarted();
    }
  };

  const handleGetStarted = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await AsyncStorage.setItem('onboarding_completed', 'true');
    router.replace('/(tabs)');
  };

  const handleSkip = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await AsyncStorage.setItem('onboarding_completed', 'true');
    router.replace('/(tabs)');
  };

  const renderSlide = ({ item, index }: { item: typeof ONBOARDING_SLIDES[0]; index: number }) => {
    const IconComponent = item.icon;
    return (
      <View style={{ width }} className="flex-1 items-center justify-center px-8">
        <Animated.View
          entering={FadeInUp.delay(index * 100)}
          className="w-32 h-32 rounded-full items-center justify-center mb-8"
          style={{ backgroundColor: `${item.color}20` }}
        >
          <IconComponent size={64} color={item.color} />
        </Animated.View>
        <Animated.Text
          entering={FadeInDown.delay(index * 100 + 100)}
          className="text-gray-900 text-3xl font-bold text-center mb-4"
        >
          {item.title}
        </Animated.Text>
        <Animated.Text
          entering={FadeInDown.delay(index * 100 + 200)}
          className="text-gray-500 text-lg text-center leading-7"
        >
          {item.description}
        </Animated.Text>
      </View>
    );
  };

  const isLastSlide = currentIndex === ONBOARDING_SLIDES.length - 1;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 bg-white">
        {/* Skip button */}
        <View
          className="absolute z-10 right-4"
          style={{ top: insets.top + 16 }}
        >
          <Pressable onPress={handleSkip} className="px-4 py-2">
            <Text className="text-gray-500 font-medium">Skip</Text>
          </Pressable>
        </View>

        {/* Slides */}
        <FlatList
          ref={flatListRef}
          data={ONBOARDING_SLIDES}
          renderItem={renderSlide}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(event) => {
            const index = Math.round(event.nativeEvent.contentOffset.x / width);
            setCurrentIndex(index);
          }}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingTop: insets.top + 60 }}
        />

        {/* Bottom section */}
        <View
          className="px-8 pb-4"
          style={{ paddingBottom: insets.bottom + 16 }}
        >
          {/* Progress dots */}
          <View className="flex-row justify-center mb-8">
            {ONBOARDING_SLIDES.map((_, index) => (
              <View
                key={index}
                className={`w-2.5 h-2.5 rounded-full mx-1.5 ${
                  index === currentIndex ? 'bg-emerald-500 w-8' : 'bg-gray-300'
                }`}
              />
            ))}
          </View>

          {/* Action button */}
          <Pressable
            onPress={handleNext}
            className="bg-emerald-500 rounded-2xl py-4 flex-row items-center justify-center active:bg-emerald-600"
          >
            {isLastSlide ? (
              <>
                <Check size={22} color="#fff" />
                <Text className="text-white font-bold text-lg ml-2">Get Started</Text>
              </>
            ) : (
              <>
                <Text className="text-white font-bold text-lg mr-2">Next</Text>
                <ArrowRight size={22} color="#fff" />
              </>
            )}
          </Pressable>

          {/* Terms notice */}
          <Text className="text-gray-400 text-xs text-center mt-4 leading-5">
            By continuing, you agree to our{' '}
            <Text
              className="text-emerald-600"
              onPress={() => router.push('/terms')}
            >
              Terms of Service
            </Text>
            {' '}and{' '}
            <Text
              className="text-emerald-600"
              onPress={() => router.push('/privacy')}
            >
              Privacy Policy
            </Text>
          </Text>
        </View>
      </View>
    </>
  );
}
