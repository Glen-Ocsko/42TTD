import { supabase } from '../lib/supabase';
import { demoPosts, demoComments, demoLikes, demoReports, demoHashtags, demoUserHashtags } from '../data/demoSocialData';

// This script would be run to seed the database with demo social data
// It's not meant to be run in the browser, but included here for reference

export async function seedSocialData() {
  console.log('Seeding social data...');
  
  try {
    // Insert demo hashtags
    console.log('Seeding hashtags...');
    for (const hashtag of demoHashtags) {
      const { error } = await supabase
        .from('hashtags')
        .upsert({
          id: hashtag.id,
          name: hashtag.name,
          post_count: hashtag.post_count,
          created_at: hashtag.created_at
        });
      
      if (error) {
        console.error(`Error inserting hashtag ${hashtag.name}:`, error);
      }
    }
    
    // Insert demo posts
    console.log('Seeding posts...');
    for (const post of demoPosts) {
      // First, find or create the activity
      let activityId = post.activity_id;
      
      if (!activityId) {
        const { data: existingActivity } = await supabase
          .from('activities')
          .select('id')
          .ilike('title', post.activity?.title || '')
          .limit(1);
        
        if (existingActivity && existingActivity.length > 0) {
          activityId = existingActivity[0].id;
        } else if (post.activity?.title) {
          // Create a new activity
          const { data: newActivity, error: activityError } = await supabase
            .from('activities')
            .insert({
              title: post.activity.title,
              description: `This is a sample activity for ${post.activity.title}`,
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
      }
      
      // Now create the post
      const { error: postError } = await supabase
        .from('activity_posts')
        .upsert({
          id: post.id,
          user_id: post.user_id,
          activity_id: activityId,
          content: post.content,
          image_url: post.media_url,
          status: post.status,
          created_at: post.created_at,
          visibility: 'public',
          hashtags: post.hashtags
        });
      
      if (postError) {
        console.error(`Error inserting post:`, postError);
      }
    }
    
    // Insert demo comments
    console.log('Seeding comments...');
    for (const comment of demoComments) {
      const { error } = await supabase
        .from('post_comments')
        .upsert({
          id: comment.id,
          post_id: comment.post_id,
          user_id: comment.user_id,
          content: comment.content,
          gif_url: comment.gif_url,
          emoji_reactions: comment.emoji_reactions,
          created_at: comment.created_at
        });
      
      if (error) {
        console.error(`Error inserting comment:`, error);
      }
    }
    
    // Insert demo likes
    console.log('Seeding likes...');
    for (const like of demoLikes) {
      const { error } = await supabase
        .from('post_likes')
        .upsert({
          id: like.id,
          post_id: like.post_id,
          user_id: like.user_id,
          created_at: like.created_at
        });
      
      if (error) {
        console.error(`Error inserting like:`, error);
      }
    }
    
    // Insert demo reports
    console.log('Seeding reports...');
    for (const report of demoReports) {
      const { error } = await supabase
        .from('post_reports')
        .upsert({
          id: report.id,
          post_id: report.post_id,
          user_id: report.user_id,
          reason: report.reason,
          extra_notes: report.extra_notes,
          status: report.status,
          created_at: report.created_at
        });
      
      if (error) {
        console.error(`Error inserting report:`, error);
      }
    }
    
    // Insert demo user hashtags
    console.log('Seeding user hashtags...');
    for (const userHashtag of demoUserHashtags) {
      const { error } = await supabase
        .from('user_hashtags')
        .upsert({
          id: userHashtag.id,
          user_id: userHashtag.user_id,
          hashtag_id: userHashtag.hashtag_id,
          created_at: userHashtag.created_at
        });
      
      if (error) {
        console.error(`Error inserting user hashtag:`, error);
      }
    }
    
    console.log('Social data seeded successfully!');
    return { success: true };
  } catch (error) {
    console.error('Error seeding social data:', error);
    return { success: false, error };
  }
}

// This function would be called to seed the database
// seedSocialData();