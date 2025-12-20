<script setup lang="ts">
const supabase = useSupabaseClient();

await supabase.auth.signOut();
await navigateTo("/");
</script>
