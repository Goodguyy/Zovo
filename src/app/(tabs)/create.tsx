import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, Image, Alert, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Camera, ImagePlus, X, Check, MapPin, Briefcase } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import Animated, { FadeIn, FadeInDown, SlideInUp } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useAppStore, NIGERIAN_AREAS, SKILL_TAGS, generateId } from '@/lib/store';
import { cn } from '@/lib/cn';

export default function CreatePostScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const currentUser = useAppStore((s) => s.currentUser);
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const addPost = useAppStore((s) => s.addPost);

  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [showSkillPicker, setShowSkillPicker] = useState(false);
  const [showAreaPicker, setShowAreaPicker] = useState(false);

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

  const toggleSkill = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter((s) => s !== skill));
    } else if (selectedSkills.length < 3) {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const handlePost = () => {
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

    const newPost = {
      id: generateId(),
      userId: currentUser.id,
      mediaUrl: mediaUri,
      mediaType: 'photo' as const,
      caption: caption.trim() || 'Check out my work!',
      skills: selectedSkills,
      area: selectedArea,
      viewCount: 0,
      createdAt: new Date().toISOString(),
    };

    addPost(newPost);

    // Reset form
    setMediaUri(null);
    setCaption('');
    setSelectedSkills([]);
    setSelectedArea(null);

    // Navigate to feed
    router.push('/(tabs)');
  };

  const canPost = mediaUri && selectedSkills.length > 0 && selectedArea;

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
            <Check size={18} color={canPost ? "#059669" : "#fff"} />
            <Text
              className={cn(
                "ml-1.5 font-semibold",
                canPost ? "text-emerald-600" : "text-white/70"
              )}
            >
              Post
            </Text>
          </Pressable>
        </View>
      </LinearGradient>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
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
          <Text className="text-gray-900 font-semibold mb-2">
            Skill Tags * (max 3)
          </Text>
          <Pressable
            onPress={() => setShowSkillPicker(!showSkillPicker)}
            className="bg-white rounded-xl p-4 flex-row items-center justify-between"
          >
            <View className="flex-row flex-wrap gap-2 flex-1">
              {selectedSkills.length > 0 ? (
                selectedSkills.map((skill) => (
                  <View
                    key={skill}
                    className="bg-emerald-100 rounded-full px-3 py-1.5 flex-row items-center"
                  >
                    <Text className="text-emerald-700 text-sm font-medium">
                      {skill}
                    </Text>
                    <Pressable
                      onPress={() => toggleSkill(skill)}
                      className="ml-1.5"
                    >
                      <X size={14} color="#047857" />
                    </Pressable>
                  </View>
                ))
              ) : (
                <Text className="text-gray-400">Select your skills...</Text>
              )}
            </View>
            <Briefcase size={20} color="#6b7280" />
          </Pressable>

          {showSkillPicker && (
            <Animated.View
              entering={SlideInUp.springify()}
              className="bg-white rounded-xl mt-2 p-4 max-h-48"
            >
              <ScrollView showsVerticalScrollIndicator={false}>
                <View className="flex-row flex-wrap gap-2">
                  {SKILL_TAGS.map((skill) => (
                    <Pressable
                      key={skill}
                      onPress={() => toggleSkill(skill)}
                      disabled={selectedSkills.length >= 3 && !selectedSkills.includes(skill)}
                      className={cn(
                        "px-3 py-2 rounded-full border",
                        selectedSkills.includes(skill)
                          ? "bg-emerald-500 border-emerald-500"
                          : "bg-white border-gray-200",
                        selectedSkills.length >= 3 && !selectedSkills.includes(skill)
                          ? "opacity-40"
                          : ""
                      )}
                    >
                      <Text
                        className={cn(
                          "text-sm font-medium",
                          selectedSkills.includes(skill)
                            ? "text-white"
                            : "text-gray-700"
                        )}
                      >
                        {skill}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </Animated.View>
          )}
        </Animated.View>

        {/* Area */}
        <Animated.View entering={FadeInDown.delay(400)} className="mb-4">
          <Text className="text-gray-900 font-semibold mb-2">
            Service Area * (broad location only)
          </Text>
          <Pressable
            onPress={() => setShowAreaPicker(!showAreaPicker)}
            className="bg-white rounded-xl p-4 flex-row items-center justify-between"
          >
            <Text className={selectedArea ? "text-gray-900" : "text-gray-400"}>
              {selectedArea || "Select your area..."}
            </Text>
            <MapPin size={20} color="#6b7280" />
          </Pressable>

          {showAreaPicker && (
            <Animated.View
              entering={SlideInUp.springify()}
              className="bg-white rounded-xl mt-2 p-4 max-h-48"
            >
              <ScrollView showsVerticalScrollIndicator={false}>
                <View className="flex-row flex-wrap gap-2">
                  {NIGERIAN_AREAS.map((area) => (
                    <Pressable
                      key={area}
                      onPress={() => {
                        setSelectedArea(area);
                        setShowAreaPicker(false);
                      }}
                      className={cn(
                        "px-3 py-2 rounded-full border",
                        selectedArea === area
                          ? "bg-emerald-500 border-emerald-500"
                          : "bg-white border-gray-200"
                      )}
                    >
                      <Text
                        className={cn(
                          "text-sm font-medium",
                          selectedArea === area ? "text-white" : "text-gray-700"
                        )}
                      >
                        {area}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </Animated.View>
          )}
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
            We only show your broad area (e.g., "Lekki"), never your precise
            location. Customers will contact you via WhatsApp or phone.
          </Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
