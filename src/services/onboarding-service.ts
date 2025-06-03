import { supabase } from '../lib/supabase';

export interface OnboardingPreferences {
  subjects: string[];
  goal: string;
  schedule: string;
  difficulty_level: string;
}

export const saveOnboardingPreferences = async (userId: string, preferences: OnboardingPreferences) => {
  try {
    const { error } = await supabase
      .from('public_bolt.user_preferences')
      .upsert({
        user_id: userId,
        subjects: preferences.subjects,
        learning_goal: preferences.goal,
        preferred_schedule: preferences.schedule,
        difficulty_level: preferences.difficulty_level,
        updated_at: new Date().toISOString()
      });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error saving onboarding preferences:', error);
    throw error;
  }
};

export const getOnboardingStatus = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('public_bolt.user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return !!data;
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    return false;
  }
};