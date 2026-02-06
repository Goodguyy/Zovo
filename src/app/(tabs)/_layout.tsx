import React from 'react';
import { Tabs } from 'expo-router';
import { Home, PlusCircle, User } from 'lucide-react-native';
import { View } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#059669',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#e5e7eb',
          height: 85,
          paddingTop: 8,
          paddingBottom: 28,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Feed',
          tabBarIcon: ({ color, focused }) => (
            <View className={focused ? "bg-emerald-50 rounded-full p-1.5" : "p-1.5"}>
              <Home size={22} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: 'Post Work',
          tabBarIcon: ({ color, focused }) => (
            <View className={focused ? "bg-emerald-50 rounded-full p-1.5" : "p-1.5"}>
              <PlusCircle size={22} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <View className={focused ? "bg-emerald-50 rounded-full p-1.5" : "p-1.5"}>
              <User size={22} color={color} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
