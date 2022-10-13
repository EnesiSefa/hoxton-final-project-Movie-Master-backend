type User = {
  id: number;
  profilePic: string;
  username: string;
  email: string;
  password: string;
  reviews?: Review[];
  favorites?: Favorite[];
  Like?: Like;
  Dislike?: Dislike;
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
  Like?: Like[];
  Dislike?: Dislike[];
};

type Like = {
  id: number;
  like: boolean;
  review: Review;
  reviewId?: number;
  user?: User;
  userId?: number;
};

type Dislike = {
  id: number;
  dislike: boolean;
  review: Review;
  reviewId?: number;
  user?: User;
  userId?: number;
};
