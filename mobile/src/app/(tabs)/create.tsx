import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, Image, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Camera, ImagePlus, X, Check } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useAppStore } from '@/lib/store';
import { createPost } from '@/lib/services/supabaseService';
import { LocationPicker } from '@/components/LocationPicker';
import { SkillsPicker } from '@/components/SkillsPicker';
import { cn } from '@/lib/cn';

export default function CreatePostScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const currentUser = useAppStore((s) => s.currentUser);
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const [isPosting, setIsPosting] = useState(false);

  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);

  // Build area string for post
  const selectedArea = selectedCity && selectedState
    ? `${selectedCity}, ${selectedState}`
    : selectedCity || selectedState || null;

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photos to upload proof of work.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setMediaUri(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow camera access to take photos of your work.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setMediaUri(result.assets[0].uri);
    }
  };

  const handlePost = async () => {
    if (!isAuthenticated || !currentUser) {
      router.push('/auth');
      return;
    }

    if (!mediaUri) {
      Alert.alert('Add photo', 'Please add a photo of your work');
      return;
    }

    if (selectedSkills.length === 0) {
      Alert.alert('Select skills', 'Please select at least one skill tag');
      return;
    }

    if (!selectedArea) {
      Alert.alert('Select area', 'Please select your service area');
      return;
    }

    setIsPosting(true);

    const result = await createPost({
      userId: currentUser.id,
      mediaUrl: mediaUri,
      mediaType: 'photo',
      caption: caption.trim() || 'Check out my work!',
      skills: selectedSkills,
      area: selectedArea,
    });

    setIsPosting(false);

    if (!result.success) {
      Alert.alert('Error', result.error || 'Failed to create post. Please try again.');
      return;
    }

    // Reset form
    setMediaUri(null);
    setCaption('');
    setSelectedSkills([]);
    setSelectedState(null);
    setSelectedCity(null);

    // Navigate to feed
    router.push('/(tabs)');
  };

  const canPost = mediaUri && selectedSkills.length > 0 && selectedArea && !isPosting;

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <LinearGradient
        colors={['#059669', '#047857']}
        style={{
          paddingTop: insets.top + 8,
          paddingBottom: 16,
          paddingHorizontal: 16,
        }}
      >
        <View className="flex-row items-center justify-between">
          <Text className="text-white text-xl font-bold">Post Your Work</Text>
          <Pressable
            onPress={handlePost}
            disabled={!canPost}
            className={cn(
              "px-4 py-2 rounded-full flex-row items-center",
              canPost ? "bg-white" : "bg-white/30"
            )}
          >
            {isPosting ? (
              <ActivityIndicator size="small" color="#059669" />
            ) : (
              <>
                <Check size={18} color={canPost ? "#059669" : "#fff"} />
                <Text
                  className={cn(
                    "ml-1.5 font-semibold",
                    canPost ? "text-emerald-600" : "text-white/70"
                  )}
                >
                  Post
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </LinearGradient>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Auth check */}
        {!isAuthenticated && (
          <Animated.View
            entering={FadeInDown}
            className="bg-amber-50 rounded-xl p-4 mb-4"
          >
            <Text className="text-amber-800 font-semibold mb-1">
              Sign up to post
            </Text>
            <Text className="text-amber-700 text-sm mb-3">
              Create an account to share your work and connect with customers.
            </Text>
            <Pressable
              onPress={() => router.push('/auth')}
              className="bg-amber-500 rounded-lg py-2.5 items-center"
            >
              <Text className="text-white font-semibold">Sign Up Now</Text>
            </Pressable>
          </Animated.View>
        )}

        {/* Media picker */}
        <Animated.View entering={FadeInDown.delay(100)} className="mb-4">
          <Text className="text-gray-900 font-semibold mb-2">
            Proof of Work Photo *
          </Text>
          {mediaUri ? (
            <View className="relative">
              <Image
                source={{ uri: mediaUri }}
                className="w-full h-56 rounded-xl"
                resizeMode="cover"
              />
              <Pressable
                onPress={() => setMediaUri(null)}
                className="absolute top-2 right-2 w-8 h-8 bg-black/50 rounded-full items-center justify-center"
              >
                <X size={18} color="#fff" />
              </Pressable>
            </View>
          ) : (
            <View className="flex-row gap-3">
              <Pressable
                onPress={takePhoto}
                className="flex-1 bg-white border-2 border-dashed border-emerald-300 rounded-xl py-8 items-center"
              >
                <View className="w-14 h-14 rounded-full bg-emerald-100 items-center justify-center mb-2">
                  <Camera size={28} color="#059669" />
                </View>
                <Text className="text-emerald-700 font-semibold">Take Photo</Text>
                <Text className="text-gray-500 text-xs mt-1">Use camera</Text>
              </Pressable>
              <Pressable
                onPress={pickImage}
                className="flex-1 bg-white border-2 border-dashed border-gray-300 rounded-xl py-8 items-center"
              >
                <View className="w-14 h-14 rounded-full bg-gray-100 items-center justify-center mb-2">
                  <ImagePlus size={28} color="#6b7280" />
                </View>
                <Text className="text-gray-700 font-semibold">Choose Photo</Text>
                <Text className="text-gray-500 text-xs mt-1">From gallery</Text>
              </Pressable>
            </View>
          )}
        </Animated.View>

        {/* Caption */}
        <Animated.View entering={FadeInDown.delay(200)} className="mb-4">
          <Text className="text-gray-900 font-semibold mb-2">
            Caption
          </Text>
          <TextInput
            value={caption}
            onChangeText={setCaption}
            placeholder="Describe your work... What did you do? How can people reach you?"
            multiline
            numberOfLines={4}
            className="bg-white rounded-xl p-4 text-gray-900 min-h-[100]"
            placeholderTextColor="#9ca3af"
            style={{ textAlignVertical: 'top' }}
          />
          <Text className="text-gray-400 text-xs mt-1 text-right">
            {caption.length}/500
          </Text>
        </Animated.View>

        {/* Skills */}
        <Animated.View entering={FadeInDown.delay(300)} className="mb-4">
          <SkillsPicker
            selectedSkills={selectedSkills}
            onSkillsChange={setSelectedSkills}
            label="Skill Tags"
            required
            maxSkills={3}
            allowCustom={true}
          />
        </Animated.View>

        {/* Area */}
        <Animated.View entering={FadeInDown.delay(400)} className="mb-4">
          <LocationPicker
            state={selectedState}
            city={selectedCity}
            onStateChange={setSelectedState}
            onCityChange={setSelectedCity}
            label="Service Area"
            required
            allowCustom={true}
          />
          <Text className="text-gray-400 text-xs mt-1">
            Only your broad area is shown, never your precise location
          </Text>
        </Animated.View>

        {/* Safety note */}
        <Animated.View
          entering={FadeInDown.delay(500)}
          className="bg-blue-50 rounded-xl p-4 mt-2"
        >
          <Text className="text-blue-800 font-semibold text-sm mb-1">
            Privacy Protected
          </Text>
          <Text className="text-blue-700 text-xs leading-5">
            We only show your broad area (e.g., "Lekki, Lagos"), never your precise
            location. Customers will contact you via WhatsApp or phone.
          </Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
