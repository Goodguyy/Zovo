import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Phone,
  User,
  MapPin,
  Briefcase,
  ChevronRight,
  Check,
  X,
} from 'lucide-react-native';
import Animated, { FadeIn, FadeInDown, SlideInUp } from 'react-native-reanimated';
import { useAppStore, NIGERIAN_AREAS, SKILL_TAGS, generateId } from '@/lib/store';
import { cn } from '@/lib/cn';

type Step = 'phone' | 'otp' | 'profile';

export default function AuthScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const login = useAppStore((s) => s.login);
  const addProfile = useAppStore((s) => s.addProfile);
  const profiles = useAppStore((s) => s.profiles);

  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [showSkillPicker, setShowSkillPicker] = useState(false);
  const [showAreaPicker, setShowAreaPicker] = useState(false);

  const formatPhone = (value: string) => {
    // Remove non-digits
    const digits = value.replace(/\D/g, '');
    // Format as Nigerian phone number
    if (digits.startsWith('234')) {
      return '+' + digits;
    } else if (digits.startsWith('0')) {
      return '+234' + digits.slice(1);
    }
    return '+234' + digits;
  };

  const handleSendOTP = () => {
    if (phone.length < 10) {
      Alert.alert('Invalid number', 'Please enter a valid phone number');
      return;
    }

    // Check if user exists
    const formattedPhone = formatPhone(phone);
    const existingProfile = profiles.find((p) => p.phone === formattedPhone);

    if (existingProfile) {
      // Simulate OTP sent
      Alert.alert('OTP Sent', 'Enter 1234 to continue (demo)', [
        { text: 'OK', onPress: () => setStep('otp') },
      ]);
    } else {
      Alert.alert('OTP Sent', 'Enter 1234 to continue (demo)', [
        { text: 'OK', onPress: () => setStep('otp') },
      ]);
    }
  };

  const handleVerifyOTP = () => {
    if (otp !== '1234') {
      Alert.alert('Invalid OTP', 'Please enter the correct code');
      return;
    }

    const formattedPhone = formatPhone(phone);
    const existingProfile = profiles.find((p) => p.phone === formattedPhone);

    if (existingProfile) {
      // Log in existing user
      login(existingProfile);
      router.replace('/(tabs)');
    } else {
      // New user - collect profile info
      setWhatsapp(formattedPhone);
      setStep('profile');
    }
  };

  const toggleSkill = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter((s) => s !== skill));
    } else if (selectedSkills.length < 3) {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const handleCreateProfile = () => {
    if (!name.trim()) {
      Alert.alert('Name required', 'Please enter your name');
      return;
    }

    if (selectedSkills.length === 0) {
      Alert.alert('Skills required', 'Please select at least one skill');
      return;
    }

    if (!selectedArea) {
      Alert.alert('Area required', 'Please select your service area');
      return;
    }

    const formattedPhone = formatPhone(phone);
    const newProfile = {
      id: generateId(),
      phone: formattedPhone,
      name: name.trim(),
      whatsapp: whatsapp || formattedPhone,
      skills: selectedSkills,
      area: selectedArea,
      createdAt: new Date().toISOString(),
      endorsementCount: 0,
    };

    addProfile(newProfile);
    login(newProfile);
    router.replace('/(tabs)');
  };

  const renderPhoneStep = () => (
    <Animated.View entering={FadeInDown} className="flex-1">
      <Text className="text-gray-900 text-2xl font-bold mb-2">
        Enter your phone
      </Text>
      <Text className="text-gray-500 mb-6">
        We'll send you a verification code
      </Text>

      <View className="bg-white rounded-xl p-4 flex-row items-center mb-4">
        <View className="bg-emerald-100 rounded-lg px-3 py-2 mr-3">
          <Text className="text-emerald-700 font-semibold">+234</Text>
        </View>
        <TextInput
          value={phone}
          onChangeText={setPhone}
          placeholder="812 345 6789"
          keyboardType="phone-pad"
          className="flex-1 text-gray-900 text-lg"
          placeholderTextColor="#9ca3af"
          maxLength={11}
        />
      </View>

      <Pressable
        onPress={handleSendOTP}
        disabled={phone.length < 10}
        className={cn(
          "rounded-xl py-4 items-center flex-row justify-center",
          phone.length >= 10 ? "bg-emerald-500" : "bg-gray-300"
        )}
      >
        <Text
          className={cn(
            "font-bold text-lg",
            phone.length >= 10 ? "text-white" : "text-gray-500"
          )}
        >
          Send Code
        </Text>
        <ChevronRight
          size={20}
          color={phone.length >= 10 ? "#fff" : "#9ca3af"}
          className="ml-1"
        />
      </Pressable>

      <Text className="text-gray-400 text-xs text-center mt-4">
        By continuing, you agree to our Terms of Service
      </Text>
    </Animated.View>
  );

  const renderOTPStep = () => (
    <Animated.View entering={FadeInDown} className="flex-1">
      <Text className="text-gray-900 text-2xl font-bold mb-2">
        Enter verification code
      </Text>
      <Text className="text-gray-500 mb-6">
        Sent to +234{phone.replace(/^0/, '')}
      </Text>

      <View className="bg-white rounded-xl p-4 mb-4">
        <TextInput
          value={otp}
          onChangeText={setOtp}
          placeholder="Enter 4-digit code"
          keyboardType="number-pad"
          className="text-gray-900 text-2xl text-center tracking-[8px]"
          placeholderTextColor="#9ca3af"
          maxLength={4}
        />
      </View>

      <Pressable
        onPress={handleVerifyOTP}
        disabled={otp.length !== 4}
        className={cn(
          "rounded-xl py-4 items-center",
          otp.length === 4 ? "bg-emerald-500" : "bg-gray-300"
        )}
      >
        <Text
          className={cn(
            "font-bold text-lg",
            otp.length === 4 ? "text-white" : "text-gray-500"
          )}
        >
          Verify
        </Text>
      </Pressable>

      <Pressable onPress={() => setStep('phone')} className="mt-4 items-center">
        <Text className="text-emerald-600 font-medium">Change phone number</Text>
      </Pressable>

      <View className="bg-blue-50 rounded-xl p-4 mt-6">
        <Text className="text-blue-800 font-semibold text-sm mb-1">
          Demo Mode
        </Text>
        <Text className="text-blue-700 text-xs">
          Enter code: 1234
        </Text>
      </View>
    </Animated.View>
  );

  const renderProfileStep = () => (
    <Animated.View entering={FadeInDown} className="flex-1">
      <Text className="text-gray-900 text-2xl font-bold mb-2">
        Create your profile
      </Text>
      <Text className="text-gray-500 mb-6">
        This will be shown to potential customers
      </Text>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Name */}
        <View className="mb-4">
          <Text className="text-gray-900 font-semibold mb-2">Your Name *</Text>
          <View className="bg-white rounded-xl p-4 flex-row items-center">
            <User size={20} color="#6b7280" />
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g., Chidi Okonkwo"
              className="flex-1 ml-3 text-gray-900"
              placeholderTextColor="#9ca3af"
            />
          </View>
        </View>

        {/* WhatsApp */}
        <View className="mb-4">
          <Text className="text-gray-900 font-semibold mb-2">
            WhatsApp Number
          </Text>
          <View className="bg-white rounded-xl p-4 flex-row items-center">
            <Phone size={20} color="#6b7280" />
            <TextInput
              value={whatsapp}
              onChangeText={setWhatsapp}
              placeholder="Same as phone if blank"
              keyboardType="phone-pad"
              className="flex-1 ml-3 text-gray-900"
              placeholderTextColor="#9ca3af"
            />
          </View>
        </View>

        {/* Skills */}
        <View className="mb-4">
          <Text className="text-gray-900 font-semibold mb-2">
            Your Skills * (max 3)
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
                      disabled={
                        selectedSkills.length >= 3 &&
                        !selectedSkills.includes(skill)
                      }
                      className={cn(
                        "px-3 py-2 rounded-full border",
                        selectedSkills.includes(skill)
                          ? "bg-emerald-500 border-emerald-500"
                          : "bg-white border-gray-200",
                        selectedSkills.length >= 3 &&
                          !selectedSkills.includes(skill) &&
                          "opacity-40"
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
        </View>

        {/* Area */}
        <View className="mb-6">
          <Text className="text-gray-900 font-semibold mb-2">
            Service Area *
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
        </View>

        <Pressable
          onPress={handleCreateProfile}
          className="bg-emerald-500 rounded-xl py-4 items-center flex-row justify-center mb-8"
        >
          <Check size={20} color="#fff" />
          <Text className="text-white font-bold text-lg ml-2">
            Create Profile
          </Text>
        </Pressable>
      </ScrollView>
    </Animated.View>
  );

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 bg-gray-50"
      >
        {/* Header */}
        <LinearGradient
          colors={['#059669', '#047857']}
          style={{
            paddingTop: insets.top + 8,
            paddingBottom: 24,
            paddingHorizontal: 16,
          }}
        >
          <View className="flex-row items-center">
            <Pressable
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full bg-white/20 items-center justify-center"
            >
              <ArrowLeft size={22} color="#fff" />
            </Pressable>
            <View className="ml-4">
              <Text className="text-white text-xl font-bold">
                {step === 'phone' && 'Sign Up'}
                {step === 'otp' && 'Verify'}
                {step === 'profile' && 'Your Profile'}
              </Text>
            </View>
          </View>

          {/* Progress indicator */}
          <View className="flex-row mt-4 gap-2">
            <View
              className={cn(
                "flex-1 h-1 rounded-full",
                step === 'phone' ? "bg-white" : "bg-white/40"
              )}
            />
            <View
              className={cn(
                "flex-1 h-1 rounded-full",
                step === 'otp' ? "bg-white" : "bg-white/40"
              )}
            />
            <View
              className={cn(
                "flex-1 h-1 rounded-full",
                step === 'profile' ? "bg-white" : "bg-white/40"
              )}
            />
          </View>
        </LinearGradient>

        <View className="flex-1 px-4 pt-6">
          {step === 'phone' && renderPhoneStep()}
          {step === 'otp' && renderOTPStep()}
          {step === 'profile' && renderProfileStep()}
        </View>
      </KeyboardAvoidingView>
    </>
  );
}
