export interface Post {
  id: string;
  title: string;
  youtubeUrl?: string;
  audioUrl?: string;
  musicStyle?: string;
  story?: string;
  lyrics?: string;
  rhythm?: string;
  coverImageUrl?: string;
  createdAt: any; // Firestore Timestamp
  authorId: string;
  viewCount?: number;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  text: string;
  createdAt: any; // Firestore Timestamp
}

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'user';
  createdAt: any;
}
