export interface Post {
  id: string;
  title: string;
  youtubeUrl?: string;
  musicStyle?: string;
  musicalCharacter?: string;
  lyricStyle?: string;
  visualStyle?: string;
  story?: string;
  lyrics?: string;
  rhythm?: string;
  imagePrompt?: string;
  coverImageUrl?: string;
  createdAt: any; // Firestore Timestamp
  authorId: string;
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
