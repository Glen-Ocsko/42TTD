import { supabase } from '../lib/supabase';
import { demoUsers, generateFollowRelationships, generateDemoPosts } from '../data/demoUsers';

// This script would be run to seed the database with demo data
// It's not meant to be run in the browser, but included here for reference

export async function seedDemoUsers() {
  console.log('Seeding demo users...');
  
  try {
    // Insert demo users into profiles table
    for (const user of demoUsers) {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          username: user.username,
          full_name: user.full_name,
          avatar_url: user.avatar_url,
          email: user.email,
          location: user.location,
          age: user.age,
          gender: user.gender,
          interests: user.interests,
          hobbies: user.hobbies,
          profile_bio: user.profile_bio,
          privacy_default: user.privacy_default,
          created_at: user.created_at,
          updated_at: user.updated_at,
          onboarding_completed: user.onboarding_completed,
          quiz_completed: user.quiz_completed,
          is_admin: user.is_admin
        });
      
      if (error) {
        console.error(`Error inserting user ${user.username}:`, error);
      }
    }
    
    console.log('Demo users seeded successfully!');
    
    // Generate and insert follow relationships
    console.log('Seeding follow relationships...');
    const follows = generateFollowRelationships();
    
    for (const follow of follows) {
      const { error } = await supabase
        .from('follows')
        .upsert({
          follower_id: follow.follower_id,
          following_id: follow.following_id,
          status: follow.status,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (error) {
        console.error(`Error inserting follow relationship:`, error);
      }
    }
    
    console.log('Follow relationships seeded successfully!');
    
    // Generate and insert demo posts
    console.log('Seeding demo posts...');
    const posts = generateDemoPosts();
    
    for (const post of posts) {
      // First, find or create the activity
      let activityId;
      
      const { data: existingActivity } = await supabase
        .from('activities')
        .select('id')
        .ilike('title', post.activity_title)
        .limit(1);
      
      if (existingActivity && existingActivity.length > 0) {
        activityId = existingActivity[0].id;
      } else {
        // Create a new activity
        const { data: newActivity, error: activityError } = await supabase
          .from('activities')
          .insert({
            title: post.activity_title,
            description: `This is a sample activity for ${post.activity_title}`,
            category_tags: ['Sample', 'Demo'],
            difficulty: Math.floor(Math.random() * 5) + 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select();
        
        if (activityError) {
          console.error(`Error creating activity:`, activityError);
          continue;
        }
        
        activityId = newActivity[0].id;
      }
      
      // Now create the post
      const { error: postError } = await supabase
        .from('activity_posts')
        .insert({
          user_id: post.user_id,
          activity_id: activityId,
          content: post.content,
          image_url: post.image_url,
          status: post.status,
          created_at: post.created_at,
          visibility: post.visibility
        });
      
      if (postError) {
        console.error(`Error inserting post:`, postError);
      }
    }
    
    console.log('Demo posts seeded successfully!');
    
    return { success: true };
  } catch (error) {
    console.error('Error seeding demo data:', error);
    return { success: false, error };
  }
}

// This function would be called to seed the database
// seedDemoUsers();