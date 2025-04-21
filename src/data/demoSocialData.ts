import { Post, Comment, Like, Flag, Hashtag, UserHashtag } from '../types/social';

// Demo posts with hashtags
export const demoPosts: Post[] = [
  {
    id: '1',
    user_id: '00000000-0000-0000-0000-000000000001',
    activity_id: '1',
    content: "Just completed my first marathon! Never thought I'd make it to the finish line. #running #achievement #fitness",
    media_url: "https://images.unsplash.com/photo-1530137073521-28cda9e40e47?auto=format&fit=crop&w=800&h=600",
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    user: {
      username: 'adventure_alex',
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=150&h=150&q=80',
      full_name: 'Alex Johnson'
    },
    activity: {
      id: '1',
      title: 'Run a Marathon'
    },
    likes_count: 42,
    comments_count: 7,
    user_liked: false,
    status: 'completed',
    hashtags: ['running', 'achievement', 'fitness']
  },
  {
    id: '2',
    user_id: '00000000-0000-0000-0000-000000000002',
    activity_id: '2',
    content: "Day 30 of learning Spanish! Can now hold basic conversations. Muy bien! #language #learning #spanish #30daychallenge",
    media_url: null,
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    user: {
      username: 'tech_tim',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=facearea&facepad=2&w=150&h=150&q=80',
      full_name: 'Timothy Chen'
    },
    activity: {
      id: '2',
      title: 'Learn a New Language'
    },
    likes_count: 28,
    comments_count: 5,
    user_liked: true,
    status: 'in_progress',
    hashtags: ['language', 'learning', 'spanish', '30daychallenge']
  },
  {
    id: '3',
    user_id: '00000000-0000-0000-0000-000000000003',
    activity_id: '3',
    content: "First time surfing today! Spent more time falling than standing, but what an amazing experience. Can't wait to try again! #surfing #ocean #newskills",
    media_url: "https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&w=800&h=600",
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    user: {
      username: 'yoga_yara',
      avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=facearea&facepad=2&w=150&h=150&q=80',
      full_name: 'Yara Singh'
    },
    activity: {
      id: '3',
      title: 'Learn to Surf'
    },
    likes_count: 56,
    comments_count: 12,
    user_liked: false,
    status: 'in_progress',
    hashtags: ['surfing', 'ocean', 'newskills']
  },
  {
    id: '4',
    user_id: '00000000-0000-0000-0000-000000000004',
    activity_id: '4',
    content: "Just cooked my first authentic paella! The secret is in the saffron and the right rice. #cooking #spain #foodie #bucketlist",
    media_url: "https://images.unsplash.com/photo-1534080564583-6be75777b70a?auto=format&fit=crop&w=800&h=600",
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    user: {
      username: 'chef_carlos',
      avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=facearea&facepad=2&w=150&h=150&q=80',
      full_name: 'Carlos Rodriguez'
    },
    activity: {
      id: '4',
      title: 'Cook a Foreign Cuisine'
    },
    likes_count: 78,
    comments_count: 15,
    user_liked: true,
    status: 'completed',
    hashtags: ['cooking', 'spain', 'foodie', 'bucketlist']
  },
  {
    id: '5',
    user_id: '00000000-0000-0000-0000-000000000005',
    activity_id: '5',
    content: "Performed at my first open mic night! Was so nervous but the crowd was supportive. #music #singing #openmic #courage",
    media_url: null,
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    user: {
      username: 'music_maya',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=facearea&facepad=2&w=150&h=150&q=80',
      full_name: 'Maya Williams'
    },
    activity: {
      id: '5',
      title: 'Perform at an Open Mic'
    },
    likes_count: 92,
    comments_count: 23,
    user_liked: false,
    status: 'completed',
    hashtags: ['music', 'singing', 'openmic', 'courage']
  },
  {
    id: '6',
    user_id: '00000000-0000-0000-0000-000000000006',
    activity_id: '6',
    content: "Training for my first ultramarathon. 50 miles seems impossible now, but taking it one day at a time. #running #ultramarathon #training #endurance",
    media_url: "https://images.unsplash.com/photo-1571008887538-b36bb32f4571?auto=format&fit=crop&w=800&h=600",
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    user: {
      username: 'runner_ryan',
      avatar_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=facearea&facepad=2&w=150&h=150&q=80',
      full_name: 'Ryan Cooper'
    },
    activity: {
      id: '6',
      title: 'Complete an Ultramarathon'
    },
    likes_count: 45,
    comments_count: 8,
    user_liked: true,
    status: 'in_progress',
    hashtags: ['running', 'ultramarathon', 'training', 'endurance']
  },
  {
    id: '7',
    user_id: '00000000-0000-0000-0000-000000000007',
    activity_id: '7',
    content: "First watercolor painting complete! Not perfect but I'm proud of it. #art #watercolor #painting #creativity",
    media_url: "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=800&h=600",
    created_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    user: {
      username: 'artist_amelia',
      avatar_url: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=facearea&facepad=2&w=150&h=150&q=80',
      full_name: 'Amelia Garcia'
    },
    activity: {
      id: '7',
      title: 'Learn to Paint'
    },
    likes_count: 67,
    comments_count: 14,
    user_liked: false,
    status: 'in_progress',
    hashtags: ['art', 'watercolor', 'painting', 'creativity']
  },
  {
    id: '8',
    user_id: '00000000-0000-0000-0000-000000000008',
    activity_id: '8',
    content: "Just caught my first wave at Bondi Beach! The feeling is indescribable. #surfing #bondibeach #australia #bucketlist",
    media_url: "https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&w=800&h=600",
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    user: {
      username: 'surfer_sam',
      avatar_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=facearea&facepad=2&w=150&h=150&q=80',
      full_name: 'Sam Wilson'
    },
    activity: {
      id: '8',
      title: 'Surf at Bondi Beach'
    },
    likes_count: 104,
    comments_count: 31,
    user_liked: true,
    status: 'completed',
    hashtags: ['surfing', 'bondibeach', 'australia', 'bucketlist']
  },
  {
    id: '9',
    user_id: '00000000-0000-0000-0000-000000000009',
    activity_id: '9',
    content: "Just finished 'War and Peace'! What a journey through 1200+ pages. #reading #literature #classics #achievement",
    media_url: null,
    created_at: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
    user: {
      username: 'bookworm_bella',
      avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=facearea&facepad=2&w=150&h=150&q=80',
      full_name: 'Bella Kim'
    },
    activity: {
      id: '9',
      title: 'Read a Classic Novel'
    },
    likes_count: 38,
    comments_count: 9,
    user_liked: false,
    status: 'completed',
    hashtags: ['reading', 'literature', 'classics', 'achievement']
  },
  {
    id: '10',
    user_id: '00000000-0000-0000-0000-000000000010',
    activity_id: '10',
    content: "Hiked to the summit of Mount Rainier today! The view was absolutely breathtaking. #hiking #mountrainier #nature #adventure",
    media_url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&h=600",
    created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    user: {
      username: 'hiker_henry',
      avatar_url: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?auto=format&fit=facearea&facepad=2&w=150&h=150&q=80',
      full_name: 'Henry Zhang'
    },
    activity: {
      id: '10',
      title: 'Hike a Mountain'
    },
    likes_count: 87,
    comments_count: 19,
    user_liked: true,
    status: 'completed',
    hashtags: ['hiking', 'mountrainier', 'nature', 'adventure']
  }
];

// Demo comments
export const demoComments: Comment[] = [
  {
    id: '1',
    post_id: '1',
    user_id: '00000000-0000-0000-0000-000000000002',
    content: "Congratulations! That's an amazing achievement. How long did you train for it?",
    created_at: new Date(Date.now() - 1.9 * 24 * 60 * 60 * 1000).toISOString(),
    user: {
      username: 'tech_tim',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=facearea&facepad=2&w=150&h=150&q=80',
      full_name: 'Timothy Chen'
    }
  },
  {
    id: '2',
    post_id: '1',
    user_id: '00000000-0000-0000-0000-000000000001',
    content: "Thanks! I trained for about 6 months. Started with short runs and gradually built up to 20-mile long runs on weekends.",
    created_at: new Date(Date.now() - 1.8 * 24 * 60 * 60 * 1000).toISOString(),
    user: {
      username: 'adventure_alex',
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=150&h=150&q=80',
      full_name: 'Alex Johnson'
    }
  },
  {
    id: '3',
    post_id: '1',
    user_id: '00000000-0000-0000-0000-000000000006',
    content: "This is so inspiring! I'm training for my first half marathon. Any tips?",
    created_at: new Date(Date.now() - 1.7 * 24 * 60 * 60 * 1000).toISOString(),
    user: {
      username: 'runner_ryan',
      avatar_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=facearea&facepad=2&w=150&h=150&q=80',
      full_name: 'Ryan Cooper'
    }
  },
  {
    id: '4',
    post_id: '2',
    user_id: '00000000-0000-0000-0000-000000000003',
    content: "¡Muy impresionante! I've been wanting to learn Spanish too. What resources did you use?",
    created_at: new Date(Date.now() - 0.9 * 24 * 60 * 60 * 1000).toISOString(),
    user: {
      username: 'yoga_yara',
      avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=facearea&facepad=2&w=150&h=150&q=80',
      full_name: 'Yara Singh'
    }
  },
  {
    id: '5',
    post_id: '2',
    user_id: '00000000-0000-0000-0000-000000000002',
    content: "I used a combination of Duolingo, YouTube videos, and conversation practice with language exchange partners. Consistency is key! 🔑",
    created_at: new Date(Date.now() - 0.8 * 24 * 60 * 60 * 1000).toISOString(),
    user: {
      username: 'tech_tim',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=facearea&facepad=2&w=150&h=150&q=80',
      full_name: 'Timothy Chen'
    }
  },
  {
    id: '6',
    post_id: '3',
    user_id: '00000000-0000-0000-0000-000000000008',
    content: "The first time is always the hardest! It gets easier and more fun with practice. Which beach were you at?",
    created_at: new Date(Date.now() - 2.5 * 24 * 60 * 60 * 1000).toISOString(),
    user: {
      username: 'surfer_sam',
      avatar_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=facearea&facepad=2&w=150&h=150&q=80',
      full_name: 'Sam Wilson'
    }
  },
  {
    id: '7',
    post_id: '3',
    user_id: '00000000-0000-0000-0000-000000000003',
    content: "I was at Waikiki Beach in Hawaii! The instructors there were amazing and so patient with beginners.",
    created_at: new Date(Date.now() - 2.4 * 24 * 60 * 60 * 1000).toISOString(),
    user: {
      username: 'yoga_yara',
      avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=facearea&facepad=2&w=150&h=150&q=80',
      full_name: 'Yara Singh'
    },
    gif_url: "https://media.giphy.com/media/3o7TKMt1VVNkHV2PaE/giphy.gif"
  },
  {
    id: '8',
    post_id: '4',
    user_id: '00000000-0000-0000-0000-000000000001',
    content: "That looks absolutely delicious! Would you mind sharing the recipe?",
    created_at: new Date(Date.now() - 4.5 * 24 * 60 * 60 * 1000).toISOString(),
    user: {
      username: 'adventure_alex',
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=150&h=150&q=80',
      full_name: 'Alex Johnson'
    }
  },
  {
    id: '9',
    post_id: '4',
    user_id: '00000000-0000-0000-0000-000000000004',
    content: "Thanks! I followed a traditional recipe from Valencia. The key ingredients are bomba rice, saffron, and fresh seafood. I'll DM you the full recipe!",
    created_at: new Date(Date.now() - 4.4 * 24 * 60 * 60 * 1000).toISOString(),
    user: {
      username: 'chef_carlos',
      avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=facearea&facepad=2&w=150&h=150&q=80',
      full_name: 'Carlos Rodriguez'
    }
  },
  {
    id: '10',
    post_id: '5',
    user_id: '00000000-0000-0000-0000-000000000007',
    content: "That's so brave! I've always wanted to perform but never had the courage. What song did you sing?",
    created_at: new Date(Date.now() - 6.5 * 24 * 60 * 60 * 1000).toISOString(),
    user: {
      username: 'artist_amelia',
      avatar_url: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=facearea&facepad=2&w=150&h=150&q=80',
      full_name: 'Amelia Garcia'
    }
  }
];

// Demo likes
export const demoLikes: Like[] = [
  {
    id: '1',
    post_id: '1',
    user_id: '00000000-0000-0000-0000-000000000002',
    created_at: new Date(Date.now() - 1.95 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '2',
    post_id: '1',
    user_id: '00000000-0000-0000-0000-000000000003',
    created_at: new Date(Date.now() - 1.9 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '3',
    post_id: '1',
    user_id: '00000000-0000-0000-0000-000000000006',
    created_at: new Date(Date.now() - 1.85 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '4',
    post_id: '2',
    user_id: '00000000-0000-0000-0000-000000000001',
    created_at: new Date(Date.now() - 0.95 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '5',
    post_id: '2',
    user_id: '00000000-0000-0000-0000-000000000003',
    created_at: new Date(Date.now() - 0.9 * 24 * 60 * 60 * 1000).toISOString()
  }
];

// Demo reports
export const demoReports: Flag[] = [
  {
    id: '1',
    post_id: '6',
    user_id: '00000000-0000-0000-0000-000000000009',
    reason: 'Spam',
    created_at: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'pending'
  },
  {
    id: '2',
    post_id: '8',
    user_id: '00000000-0000-0000-0000-000000000005',
    reason: 'Inappropriate Content',
    extra_notes: 'This post contains misleading information about surfing safety.',
    created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'reviewed'
  }
];

// Demo hashtags
export const demoHashtags: Hashtag[] = [
  {
    id: '1',
    name: 'running',
    post_count: 15,
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '2',
    name: 'fitness',
    post_count: 28,
    created_at: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '3',
    name: 'cooking',
    post_count: 22,
    created_at: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '4',
    name: 'travel',
    post_count: 45,
    created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '5',
    name: 'art',
    post_count: 19,
    created_at: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '6',
    name: 'music',
    post_count: 31,
    created_at: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '7',
    name: 'reading',
    post_count: 17,
    created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '8',
    name: 'hiking',
    post_count: 24,
    created_at: new Date(Date.now() - 65 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '9',
    name: 'surfing',
    post_count: 12,
    created_at: new Date(Date.now() - 70 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '10',
    name: 'bucketlist',
    post_count: 38,
    created_at: new Date(Date.now() - 75 * 24 * 60 * 60 * 1000).toISOString()
  }
];

// Demo user hashtags
export const demoUserHashtags: UserHashtag[] = [
  {
    id: '1',
    user_id: '00000000-0000-0000-0000-000000000001',
    hashtag_id: '1',
    hashtag_name: 'running',
    post_count: 15,
    created_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '2',
    user_id: '00000000-0000-0000-0000-000000000001',
    hashtag_id: '2',
    hashtag_name: 'fitness',
    post_count: 28,
    created_at: new Date(Date.now() - 26 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '3',
    user_id: '00000000-0000-0000-0000-000000000002',
    hashtag_id: '7',
    hashtag_name: 'reading',
    post_count: 17,
    created_at: new Date(Date.now() - 27 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '4',
    user_id: '00000000-0000-0000-0000-000000000003',
    hashtag_id: '9',
    hashtag_name: 'surfing',
    post_count: 12,
    created_at: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '5',
    user_id: '00000000-0000-0000-0000-000000000004',
    hashtag_id: '3',
    hashtag_name: 'cooking',
    post_count: 22,
    created_at: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString()
  }
];