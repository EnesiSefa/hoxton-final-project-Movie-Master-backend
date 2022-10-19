type User = {
  id: number;
  profilePic: string;
  username: string;
  email: string;
  password: string;
  reviews?: Review[];
  favorites?: Favorite[];
  messages: Message[];
  likeDislike: LikeDislike | null;
  chats: Chat[];
  friends: Friendship[];
};
type Friendship = {
  id: number;
  friend: User;
  friendId: number;
};
type Chat = {
  id: number;
  messages: Message[];
  users: User[];
};
type Message = {
  id: number;
  content: string;
  date: string;
  user: User;
  userId: number;
  Chat: Chat;
  chatId: number;
};
type Movie = {
  id: number;
  title: string;
  rating: number;
  favorite?: Favorite;
  favoriteId?: number;
  reviews?: Review[];
};

type Favorite = {
  id: number;
  movies?: Movie[];
  User?: User;
  userId?: number;
};

type Review = {
  id: number;
  comment: string;
  user?: User;
  userId?: number;
  Movie?: Movie;
  movieId?: number;
};

type LikeDislike = {
  id: number;
  dislike: boolean;
  review: Review;
  reviewId?: number;
  user?: User;
  userId?: number;
};
