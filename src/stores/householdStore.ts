import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/lib/supabase';
import type { Household, HouseholdMember } from '@/types/database';

interface HouseholdState {
  households: HouseholdMember[];
  activeHouseholdId: string | null;
  loading: boolean;

  activeHousehold: () => HouseholdMember | undefined;
  fetchHouseholds: (userId: string) => Promise<void>;
  setActiveHousehold: (householdId: string) => void;
  createHousehold: (name: string, userId: string) => Promise<{ data: Household | null; error: string | null }>;
  joinHousehold: (inviteCode: string, userId: string) => Promise<{ error: string | null }>;
  removeMember: (memberId: string, householdId: string) => Promise<{ error: string | null }>;
  deleteHousehold: (householdId: string) => Promise<{ error: string | null }>;
  reset: () => void;
}

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export const useHouseholdStore = create<HouseholdState>()(
  persist(
    (set, get) => ({
      households: [],
      activeHouseholdId: null,
      loading: false,

      activeHousehold: () => {
        const { households, activeHouseholdId } = get();
        return households.find((h) => h.household_id === activeHouseholdId);
      },

      fetchHouseholds: async (userId: string) => {
        set({ loading: true });
        try {
          const { data, error } = await supabase
            .from('household_members')
            .select(`
              *,
              household:households(*),
              profile:profiles(*)
            `)
            .eq('profile_id', userId);

          if (error) throw error;

          const members = (data || []) as unknown as HouseholdMember[];
          set({ households: members });

          // Auto-select first household if none is active
          if (!get().activeHouseholdId && members.length > 0) {
            set({ activeHouseholdId: members[0].household_id });
          }
        } catch (err) {
          console.error('Error fetching households:', err);
        } finally {
          set({ loading: false });
        }
      },

      setActiveHousehold: (householdId: string) => {
        set({ activeHouseholdId: householdId });
      },

      createHousehold: async (name: string, userId: string) => {
        const inviteCode = generateInviteCode();

        const { data: household, error: householdError } = await supabase
          .from('households')
          .insert({
            name,
            invite_code: inviteCode,
            created_by: userId,
          })
          .select()
          .single();

        if (householdError) {
          return { data: null, error: householdError.message };
        }

        // Add creator as admin member
        const { error: memberError } = await supabase
          .from('household_members')
          .insert({
            household_id: household.id,
            profile_id: userId,
            role: 'admin',
          });

        if (memberError) {
          return { data: null, error: memberError.message };
        }

        // Refresh households
        await get().fetchHouseholds(userId);
        set({ activeHouseholdId: household.id });

        return { data: household as Household, error: null };
      },

      joinHousehold: async (inviteCode: string, userId: string) => {
        // Find household by invite code
        const { data: household, error: findError } = await supabase
          .from('households')
          .select('id')
          .eq('invite_code', inviteCode.toUpperCase().trim())
          .single();

        if (findError || !household) {
          return { error: 'Código de invitación inválido. Verifica e intenta de nuevo.' };
        }

        // Check if already a member
        const { data: existing } = await supabase
          .from('household_members')
          .select('id')
          .eq('household_id', household.id)
          .eq('profile_id', userId)
          .maybeSingle();

        if (existing) {
          return { error: 'Ya eres miembro de este hogar.' };
        }

        // Join as member
        const { error: joinError } = await supabase
          .from('household_members')
          .insert({
            household_id: household.id,
            profile_id: userId,
            role: 'member',
          });

        if (joinError) {
          return { error: joinError.message };
        }

        await get().fetchHouseholds(userId);
        set({ activeHouseholdId: household.id });

        return { error: null };
      },

      removeMember: async (memberId: string, householdId: string) => {
        const { error } = await supabase
          .from('household_members')
          .delete()
          .eq('profile_id', memberId)
          .eq('household_id', householdId);

        if (error) return { error: error.message };
        return { error: null };
      },

      deleteHousehold: async (householdId: string) => {
        // Delete all members first
        await supabase
          .from('household_members')
          .delete()
          .eq('household_id', householdId);

        const { error } = await supabase
          .from('households')
          .delete()
          .eq('id', householdId);

        if (error) return { error: error.message };

        // Update local state
        const { households } = get();
        const remaining = households.filter((h) => h.household_id !== householdId);
        set({
          households: remaining,
          activeHouseholdId: remaining.length > 0 ? remaining[0].household_id : null,
        });

        return { error: null };
      },

      reset: () => {
        set({ households: [], activeHouseholdId: null, loading: false });
      },
    }),
    {
      name: 'domux-household',
      partialize: (state) => ({ activeHouseholdId: state.activeHouseholdId }),
    }
  )
);
